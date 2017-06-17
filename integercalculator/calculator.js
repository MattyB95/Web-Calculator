/* Most of the work is at the client end, apart from the calculations.  The 
 client is to be implemented as an HTML file containing JavaScript and using the
 JQuery libraries. The web client accepts events from the button presses, and all
 data and functions are input via the calculator keypad.  It should not be
 possible to type numbers into the numeric display directly from the keyboard.

 The operation of the calculator input needs a bit of thought.  This should
 perform in the same way as a normal 'basic' calculator - you should check a real
 calculator or (e.g.) a windows calculator to make sure you know exactly how it
 operates and any idiosyncrasies that users will expect. */
$(document).ready(function () {

    // display used to make accessing the display element quicker and easier.
    var display = $('#display');
    // calculation array will store the entire calculation being performed.
    var calculation = [];
    // clearNext will change depending on whether the display should be cleared on the next input.
    var clearNext = false;
    // finish will change once the final calculation has been performed (i.e. when "=" pressed).
    var finish = false;
    // canChange changes to keep track of whether the display can / should be changed.
    var canChange = true;

    // Stores the first operand to be sent to the server.
    var firstOperand;
    // Stores the operation that is to be performed on the two operands and sent to server.
    var operation;
    // Stores the second operand to be sent to the server.
    var secondOperand;

    // preOperand will keep track of the previous operand (i.e. secondOperand) for certain cases (like user pressing "=" again).
    var preOperand;

    /* The main function that will be called when all calculator buttons are 
     pressed. It starts by calling a jQuery UI effect "Highlight" on the button
     to make the user more aware that the button has been pressed and goes on to
     perform the correct response based on the calculators current state. */
    $('.number').click(function () {
        $(this).effect("highlight", {
            color: '#00CCFF'
        }, 150);
        if (!finish) {
            /* If the calculation hasn't finished yet (i.e. "=" not pressed).
             The button pressed was not an operation (i.e. a digit),
             allow the display to be changed. */
            canChange = true;
            if (isClear() || clearNext) {
                // If the displayed needs to be cleared, clear it.
                changeDisplay('');
                clearNext = false;
            }
            if (checkDisplayLength()) {
                // If the text is within bounds (i.e <= 8) then change the display.
                changeDisplay(display.text() + $(this).text());
            }
        } else {
            // Else the calculation was finished or was cancelled due to an error.
            clear();
            /* The button pressed was not an operation (i.e. it is a digit),
             change the display to the text of the button pressed and don't
             clear the screen next time by changing clearNext to false. */
            changeDisplay($(this).text());
            clearNext = false;
            canChange = true;
            // The finish operations are now complete, set finish to false.
            finish = false;
        }
    });

    /* The main function that will be called when all operation buttons are 
     pressed. It starts by calling a jQuery UI effect "Highlight" on the button
     to make the user more aware that the button has been pressed and goes on to
     perform the correct response based on the calculators current state. */
    $('.operation').click(function () {
        $(this).effect("highlight", {
            color: '#00CCFF'
        }, 150);
        if (!finish) {
            // If the calculation hasn't finished yet (i.e. "=" not pressed).
            if (display.text() !== 'Err' || $(this).hasClass('clear')) {
                /* If the button pressed was an operation ("+", "-", "/", "*", "=")
                 and not currently displaying the error message or the button pressed
                 was a clear function ("C", "CE") call the method handleOperation
                 passing the operation as a parameter. */
                handleOperation($(this).text());
            }
        } else {
            /* Else the calculation was finished or was cancelled due to an error.
             Temporarily store the display value in a variable. */
            var temp = display.text();
            if ($(this).text() !== '=') {
                // If the button pressed was not equals then clear the display.
                clear();
            } else if (display.text() !== 'Err') {
                /* If it was equals and the display is not an error, then replace the first 
                 operand with the current display value. */
                firstOperand = displayToInt();
            }
            /* Change the display with the temporary variable. This helps when
             an error has occurred to stop operations displaying in calculation display. */
            changeDisplay(temp);
            if (display.text() !== 'Err' || $(this).hasClass('clear')) {
                /* If the button pressed was an operation ("+", "-", "/", "*", "=")
                 and not currently displaying the error message or the button pressed
                 was a clear function ("C", "CE") call the method handleOperation
                 passing the operation as a parameter. */
                handleOperation($(this).text());
            }
            // The finish operations are now complete, set finish to false.
            finish = false;
        }
    });

    /* The handleOperation function will detail with what to do if an operation
     button has been pressed on the calculator. */
    function handleOperation(currentOperation) {
        switch (currentOperation) {
            case '+':
            case '-':
            case '/':
            case '*':
                if (canChange) {
                    /* If the operation was an arithmetic function, call
                     addTOCalculation and addOperand, then check whether a
                     calculation should be performed with shouldPerformCalculation.
                     Afterwards set the operation to the one provided and set canChange
                     to false to prevent further changes. */
                    addToCalculation(currentOperation);
                    addOperand();
                    shouldPerformCalculation();
                    operation = currentOperation;
                    canChange = false;
                } else {
                    /* Else means the user is changing operation without entering a 
                     digit, therefore handle the operation change */
                    operation = currentOperation;
                    calculation.pop();
                    calculation.push(currentOperation);
                    displayCalculation();
                }
                break;
            case '=':
                if (!finish) {
                    /* If the calculation has not finished place whatever is currently 
                     in the display in the secondOperand variable. */
                    secondOperand = displayToInt();
                } else {
                    /* Else the calculation had previously completed so set the 
                     secondOperand to the previous operand and set preOperand to null. */
                    secondOperand = preOperand;
                    preOperand = null;
                }
                // Perform the calculation.
                performCalculation(false);
                break;
            case 'CE':
                // Clear the current entry.
                clearEntry();
                break;
            case 'C':
                // Clear the entire calculation.
                clear();
                break;
        }
        // Clear the display on next input.
        clearNext = true;
    }

    /* The addOperand function will set the display to correct operand variable 
     based on which one currently needs filling. */
    function addOperand() {
        if (firstOperand === null) {
            firstOperand = displayToInt();
        } else {
            secondOperand = displayToInt();
        }
    }

    /* The performCalculation function sends the operands and the corresponding
     operation to the server to be performed and displays the response. */
    function performCalculation(additionalOperations) {
        $.post('calculate.php', {
                firstOperand: firstOperand,
                operation: operation,
                secondOperand: secondOperand
            },
            function (result) {
                if (additionalOperations) {
                    /* If there are more inputs to come (i.e. this wasn't triggered
                     by "=") then call resetVariables and set the result to the
                     first operand for more operations to be performed upon. */
                    resetVariables();
                    firstOperand = result;
                } else {
                    /* Else calculation finished (i.e. triggered by "=") so clear the
                     entire calculation and set preOperand to the second operand in
                     case the user presses "=" again and set finish to true. */
                    clearCalculation();
                    preOperand = secondOperand;
                    finish = true;
                }
                // Change the display to show the result.
                changeDisplay(result);
            });
    }

    // Check if the display is already cleared.
    function isClear() {
        return display.text() === 0;
    }

    // Check if the display has not exceeded the maximum input of 8.
    function checkDisplayLength() {
        return display.text().length < 8;
    }

    // Return the display value as an integer.
    function displayToInt() {
        return parseInt(display.text());
    }

    // Add data to the calculation array to store the entire calculation.
    function addToCalculation(currentOperation) {
        calculation.push(displayToInt());
        calculation.push(currentOperation);
        displayCalculation();
    }

    /* Loop through the calculation array and display the content of the entire
     calculation above the main display. */
    function displayCalculation() {
        var cal_display = $('#cal_display');
        cal_display.text('');
        for (var index = 0; index < calculation.length; index++) {
            cal_display.text(cal_display.text() + ' ' + calculation[index]);
        }
    }

    /* change the display to the passed parameter. If the parameter is greater than
     8 then an error has occurred so display "Err" and finish will then become true. */
    function changeDisplay(input) {
        if (input.length <= 8) {
            display.text(input);
        } else {
            clear();
            display.text('Err');
            finish = true;
        }
    }

    // Clear the calculation array and clear the calculation display.
    function clearCalculation() {
        calculation = [];
        displayCalculation();
    }

    // Clear the current entry by changing the display to 0.
    function clearEntry() {
        changeDisplay('0');
    }

    // Clear the entire calculation and get ready for a new one to be performed.
    function clear() {
        clearCalculation();
        clearEntry();
        resetVariables();
        operation = null;
    }

    // Reset all the variables.
    function resetVariables() {
        firstOperand = null;
        secondOperand = null;
        preOperand = null;
    }

    // Check if a calculation should be performed and if so perform it.
    function shouldPerformCalculation() {
        if ($.isNumeric(firstOperand) && $.isNumeric(secondOperand)) {
            performCalculation(true);
        }
    }

});
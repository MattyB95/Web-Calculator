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
    // decimalUsed changes to show if the decimal point has been used, as an operand can only have one decimal point.
    var decimalUsed = false;

    // Stores the first operand to be sent to the server.
    var firstOperand;
    // Stores the operation that is to be performed on the two operands and sent to server.
    var operation;
    // Stores the second operand to be sent to the server.
    var secondOperand;

    // preOperand will keep track of the previous operand (i.e. secondOperand) for certain cases (like user pressing "=" again).
    var preOperand;

    /* The main function that will be called when all numeric buttons are 
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
                if ($(this).text() === '.' && !decimalUsed && isClear()) {
                    /* If the '.' button was pressed and the decimal can be used
                     and the screen is currently clear display, than show the
                     display with a 0 (e.g. '0.') and set decimalUsed to true. */
                    changeDisplay('0' + $(this).text());
                    decimalUsed = true;
                } else if ($(this).text() === '.' && !decimalUsed) {
                    /* If the '.' button was pressed and the decimal can be used
                     display the decimal and set decimalUsed to true. */
                    changeDisplay(display.text() + $(this).text());
                    decimalUsed = true;
                } else if ($(this).text() !== '.') {
                    /* If the '.' button was not pressed (i.e. button pressed
                     was a number), then add the number to the display. */
                    changeDisplay(display.text() + $(this).text());
                }
            }
        } else {
            // Else the calculation was finished or was cancelled due to an error.
            clear();
            /* The button pressed was not an operation (i.e. it is a digit),
             change the display to the text of the button pressed and don't
             clear the screen next time by changing clearNext to false. */
            if ($(this).text() === '.') {
                // If the decimal was selected change decimal used to true. 
                changeDisplay('0' + $(this).text());
                decimalUsed = true;
            } else {
                changeDisplay($(this).text());
            }
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
                firstOperand = displayToFloat();
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
                     to false to prevent further changes and decimalUsed to false
                     so it can be used again for new input. */
                    addToCalculation(currentOperation);
                    addOperand();
                    shouldPerformCalculation();
                    operation = currentOperation;
                    decimalUsed = false;
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
                    secondOperand = displayToFloat();
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
            firstOperand = displayToFloat();
        } else {
            secondOperand = displayToFloat();
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
                    /* Else calculation finished (i.e. trigged by "=") so clear the
                     entire calculation and set preOperand to the second operand in
                     case the user presses "=" again and set finish to true. */
                    clearCalculation();
                    preOperand = secondOperand;
                    finish = true;
                }
                // Change the display to show the result.
                resizeResult(result);
            });
    }

    // Check if the display is already cleared.
    function isClear() {
        return display.text() === '0' || display.text() === '';
    }

    // Check if the display has not exceeded the maximum input of 8.
    function checkDisplayLength() {
        return display.text().length < 8;
    }

    // Return the display value as an integer.
    function displayToFloat() {
        return parseFloat(display.text());
    }

    // Add data to the calculation array to store the entire calculation.
    function addToCalculation(currentOperation) {
        calculation.push(displayToFloat());
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
        decimalUsed = false;
    }

    // Check if a calculation should be performed and if so perform it.
    function shouldPerformCalculation() {
        if ($.isNumeric(firstOperand) && $.isNumeric(secondOperand)) {
            performCalculation(true);
        }
    }

    // Change the result to be displayed correctly on the display.
    function resizeResult(result) {
        // Convert the result to a string.
        var result_string = result.toString();
        if (result_string.indexOf('.') > -1) {
            // If the result contains a decimal.
            while (result_string.length > 8) {
                // While the result with a decimal is greater than 8 cut it down to a length of 8.
                if (result_string.length === 9) {
                    /* If its current length is 9 (i.e. it's about to become 8). Calculate
                     the length of the decimal part of the number. */
                    var decimalLength = result_string.length - result_string.indexOf('.') - 1;
                    if (decimalLength > 0) {
                        /* If the length of the decimal is greater than 0 then cut the result down and
                         round the answer so that it has the decimal length - 1 to make it length 8
                         overall. */
                        result_string = parseFloat(result_string).toFixed(decimalLength - 1).toString();
                    } else {
                        /* If the last digit is the decimal '.' then remove it and return a 
                         7 digit string. */
                        result_string = parseFloat(result_string).toFixed(0).toString();
                    }
                } else {
                    // Else the result is not about to have a length of 8 so remove the last digit.
                    result_string = result_string.substring(0, result_string.length - 1);
                }
            }
            if (isNaN(result_string.substring(result_string.length - 1))) {
                /* If by cutting the string down to length 8, the final digit is not numeric 
                 (e.g. "E", "+", "-"), then the result could not fit onto the display at all so echo
                 a message which is greater than length 8 to make the calculator display 'Err'. */
                result_string = 'Display the error message';
            }
        }
        changeDisplay(result_string);
    }

});
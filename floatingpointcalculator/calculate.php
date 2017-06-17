<?php
/* The server is to be implemented in php.  The server code should be relatively 
simple as all it needs to do is to implement the arithmetic calculations.  The 
web server performs whatever calculation is being requested and sends back the 
result.  The interactions between the client and server are performed using AJAX 
style interactions, so the client web page does not need to be reloaded.  The 
named parameters to the calculation are accessed via the $_POST[] associative 
array, as we would when processing web forms.  The result of the calculation can 
be returned as a string, without the need for any XML encoding.  The server does 
not retain any client state. */

/* Retrieve the operands and operation from the $_POST associative array and store
them in variables to access. */
if (isset($_POST['firstOperand'])) {
    $firstOperand = $_POST['firstOperand'];
}
if (isset($_POST['operation'])) {
    $operation = $_POST['operation'];
} else {
    $operation = '';
}
if (isset($_POST['secondOperand'])) {
    $secondOperand = $_POST['secondOperand'];
}

// Check the operation request, perform it and store the result in a result variable.
switch ($operation) {
    case '+':
        $result = $firstOperand + $secondOperand;
        break;
    case '-':
        $result = $firstOperand - $secondOperand;
        break;
    case '*':
        $result = $firstOperand * $secondOperand;
        break;
    case '/':
        $result = $firstOperand / $secondOperand;
        break;
    case '':
        $result = $secondOperand;
}
// Echo the result so it can be retrieved in the callback function.
echo $result;
?>
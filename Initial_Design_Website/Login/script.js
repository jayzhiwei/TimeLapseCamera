function toggleAuthSection() {
    var loginSection = document.getElementById('loginSection');
    var signupSection = document.getElementById('signupSection');
    var toggleLink = document.getElementById('toggleLink');

    if (loginSection.style.display === 'none') {
        loginSection.style.display = 'block';
        signupSection.style.display = 'none';
        toggleLink.innerHTML = "Don't have an account? <a href='#' onclick='toggleAuthSection()'>Sign Up</a>";
    } else {
        loginSection.style.display = 'none';
        signupSection.style.display = 'block';
        toggleLink.innerHTML = "Already have an account? <a href='#' onclick='toggleAuthSection()'>Login</a>";
    }
}

function login() {
    // Add login logic here
    alert('Login button clicked');
}

function sendOTP() {
    // Add logic to send OTP to the provided email
    alert('OTP sent to your email.');

    // Hide the details section after sending OTP
    document.getElementById('signupDetails').style.display = 'none';
}

function submitOTP() {
    // Add logic to verify OTP and unlock the next step
    var enteredOTP = document.getElementById('otp').value;

    // Replace this with your OTP verification logic
    if (enteredOTP === '123456') {  // Example OTP for demonstration
        alert('OTP is correct. You can proceed to the next step.');

        // Show the details section after submitting OTP
        document.getElementById('signupDetails').style.display = 'block';
    } else {
        alert('Incorrect OTP. Please try again.');
    }
}

function signup() {
    // Add signup logic here

    // Get input values
    var signupEmail = document.getElementById('signupEmail').value;
    var signupUsername = document.getElementById('signupUsername').value;
    var signupPassword = document.getElementById('signupPassword').value;
    var confirmPassword = document.getElementById('confirmPassword').value;

    // Check username and password (Step 3)
    if (signupUsername.length === 0 || signupPassword.length === 0 || confirmPassword.length === 0) {
        alert('Please enter your username and password.');
        return;
    }

    // Check password confirmation
    if (signupPassword !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    // If all checks pass, you can proceed with signup
    alert('Sign-up successful!');
}

function goBack() {
    // Use the browser's history object to go back
    window.history.back();
}

function login() {
// Replace these values with your actual username and password
var validUsername = 'jayzw96';
var validPassword = 'qweqwe1411';

var enteredUsername = document.getElementById('loginUsername').value;
var enteredPassword = document.getElementById('loginPassword').value;

if (enteredUsername === validUsername && enteredPassword === validPassword) {
    alert('Login successful! Redirecting to user homepage...');
    window.location.href = "/UserHomepage/userIndex.html"; // Replace with your actual user homepage URL
} else {
    alert('Invalid username or password. Please try again.');
}
}
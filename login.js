// Redirect to Google Login when "Login with Google" is clicked
document.querySelector('.google-login-button').addEventListener('click', function (e) {
  e.preventDefault(); // Prevent default link behavior
  window.location.href = 'http://localhost:3000/login'; // Redirect to the /login endpoint on your backend
});

// Handle Google Sign-In (if using the Google JS library)
function onSignIn(googleUser) {
  const profile = googleUser.getBasicProfile();
  console.log('Logged in as: ' + profile.getName());

  const userEmail = profile.getEmail();
  alert('Login successful with Google!');
  console.log('User Email: ' + userEmail);

  window.location.href = 'homepage.html';
}

// Handle Google Sign-Out (if using the Google JS library)
function signOut() {
  const auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
    console.log('User signed out.');
  });
}

// Handle traditional form-based login
document.getElementById('login-form').addEventListener('submit', async function (e) {
  e.preventDefault(); // Prevent default form submission

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorMessage = document.getElementById('error-message');

  if (username === '' || password === '') {
    errorMessage.textContent = 'All fields are required!';
    errorMessage.style.display = 'block';
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();

    if (response.ok) {
      alert(result.message);
      localStorage.setItem('token', result.token); // Save token to localStorage
      window.location.href = 'homepage.html'; // Redirect to the homepage
    } else {
      errorMessage.textContent = result.error;
      errorMessage.style.display = 'block';
    }
  } catch (err) {
    console.error(err);
    errorMessage.textContent = 'An error occurred. Please try again!';
    errorMessage.style.display = 'block';
  }
});

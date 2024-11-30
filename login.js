function onSignIn(googleUser) {
  const profile = googleUser.getBasicProfile();
  console.log('Logged in as: ' + profile.getName());

  const userEmail = profile.getEmail();
  alert('Login successful with Google!');
  console.log("User Email: " + userEmail);

  window.location.href = "homepage.html";
}

function signOut() {
  const auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
    console.log('User signed out.');
  });
}

document.getElementById('login-form').addEventListener('submit', async function (e) {
  e.preventDefault();

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
      localStorage.setItem('token', result.token); 
      window.location.href = "homepage.html"; 
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

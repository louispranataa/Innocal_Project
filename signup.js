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

document.getElementById('signin-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const newUsername = document.getElementById('new-username').value.trim();
  const newPassword = document.getElementById('new-password').value.trim();
  const confirmPassword = document.getElementById('confirm-password').value.trim();
  const errorMessage = document.getElementById('error-message');

  // Validasi form Sign Up
  if (newUsername === '' || newPassword === '' || confirmPassword === '') {
    errorMessage.textContent = 'All fields are required!';
    errorMessage.style.display = 'block';
    return;
  } else if (newPassword !== confirmPassword) {
    errorMessage.textContent = 'Passwords do not match!';
    errorMessage.style.display = 'block';
    return;
  }

  try {
    // Kirim data ke backend
    const response = await fetch('http://localhost:3000/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newUsername, password: newPassword }),
    });

    const result = await response.json();

    if (response.ok) {
      alert(result.message);
      window.location.href = "login.html"; // Redirect ke halaman login
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

// Home dashboard: stats strip and playlist grid cards
// Home page logic

document.addEventListener(
  'DOMContentLoaded',
  function() {

    AppAuth.requireAuth(function(user) {

      document.body.innerHTML = `
        <div class="app-container">
          <main class="page">
            <h1 class="page-title">
              Welcome,
              ${user.displayName}
            </h1>
          </main>
        </div>
      `;

    });

  }
);
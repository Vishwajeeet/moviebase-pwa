// Authentication helpers

window.AppAuth = {

  signInWithGoogle: function() {
    var provider =
      new firebase.auth.GoogleAuthProvider();

    provider.setCustomParameters({ prompt: 'select_account' });

    return auth.signInWithPopup(provider);
  },

  signOut: function() {
    return auth.signOut();
  },

  requireAuth: function(callback) {
    auth.onAuthStateChanged(function(user) {

      if (user) {
        callback(user);
      } else {
        window.location.href = '/index.html';
      }

    });
  },

  onAuthReady: function(callback) {
    auth.onAuthStateChanged(function(user) {
      callback(user);
    });
  }

};
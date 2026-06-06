// Firestore database operations for playlists and entries
window.AppDB = {

  createPlaylist: function(uid, name) {
    return db.collection('users').doc(uid)
      .collection('playlists').add({
        name: name,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
  },

  getPlaylists: function(uid) {
    return db.collection('users').doc(uid)
      .collection('playlists')
      .orderBy('createdAt', 'asc')
      .get()
      .then(function(snap) {
        return snap.docs.map(function(doc) {
          return Object.assign({ id: doc.id }, doc.data());
        });
      });
  },

  updatePlaylistName: function(uid, playlistId, name) {
    return db.collection('users').doc(uid)
      .collection('playlists').doc(playlistId)
      .update({
        name: name,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
  },

  addEntry: function(uid, entryData) {
    var data = Object.assign({}, entryData, {
      addedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return db.collection('users').doc(uid)
      .collection('entries').add(data);
  },

  getEntriesByPlaylist: function(uid, playlistId) {
    return db.collection('users').doc(uid)
      .collection('entries')
      .where('playlistId', '==', playlistId)
      .orderBy('addedAt', 'desc')
      .get()
      .then(function(snap) {
        return snap.docs.map(function(doc) {
          return Object.assign({ id: doc.id }, doc.data());
        });
      });
  },

  getAllEntries: function(uid) {
    return db.collection('users').doc(uid)
      .collection('entries')
      .orderBy('addedAt', 'desc')
      .get()
      .then(function(snap) {
        return snap.docs.map(function(doc) {
          return Object.assign({ id: doc.id }, doc.data());
        });
      });
  },

  deleteEntry: function(uid, entryId) {
    return db.collection('users').doc(uid)
      .collection('entries').doc(entryId).delete();
  },

  updateEntry: function(uid, entryId, data) {
    return db.collection('users').doc(uid)
      .collection('entries').doc(entryId).update(data);
  },

  moveEntry: function(uid, entryId, newPlaylistId) {
    return db.collection('users').doc(uid)
      .collection('entries').doc(entryId)
      .update({
        playlistId: newPlaylistId,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
  }

};
/*----------------------------------------------------------------
     Resource: vClient (Server)
     Script: handlers: app: contacts.js
     Author: vStudio
     Developer(s): Aviril, Mario, Tron
     DOC: 23/11/2021
     Desc: Contacts Handler
----------------------------------------------------------------*/


/*-----------
-- Imports --
-----------*/

const databaseHandler = require("../database")
const instanceHandler = require("./instance")


/*------------
-- Handlers --
------------*/

module.exports = {
  initializeSocket(socketServer, socket) {
    socket.on("App:onClientAcceptFriendRequest", function(UID) {
      if (!UID) return false
      const clientInstances, clientUID = instanceHandler.getInstancesBySocket(this)
      if (!clientInstance || !clientUID || !databaseHandler.instances.users.hasChild(clientUID) || !databaseHandler.instances.users.hasChild(UID)) return false
      const cDate = new Date()
      databaseHandler.instances.users.child(clientUID).child("contacts").child("friends").update({
        UID: cDate
      })
      databaseHandler.instances.users.child(UID).child("contacts").child("friends").update({
        UID: cDate
      })
    })
  }
}
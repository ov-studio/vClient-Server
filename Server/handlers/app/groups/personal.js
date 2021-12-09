/*----------------------------------------------------------------
     Resource: vClient (Server)
     Script: handlers: app: groups: personal.js
     Author: vStudio
     Developer(s): Aviril, Mario, Tron
     DOC: 23/11/2021
     Desc: Personal Group Handler
----------------------------------------------------------------*/


/*-----------
-- Imports --
-----------*/

const eventServer = require("../../../servers/event")
const databaseHandler = require("../../database")
const instanceHandler = require("../instance")
const contactsHandler = require("../contacts")


/*------------
-- Handlers --
------------*/

async function getUserGroups(UID, socket) {
  if (!UID && !socket) return false
  if (!UID) {
    const socketInstance = instanceHandler.getInstancesBySocket(socket)
    if (!socketInstance) return false
    UID = socketInstance.UID
  }
  if (!UID) return false

  const fetchedContacts = await contactsHandler.getUserContacts(UID, null, "friends")
  if (!fetchedContacts) return false
  const fetchedGroups = []
  Object.entries(fetchedContacts).forEach(function(contactData) {
    fetchedGroups.push({
      UID: contactData[1].group,
      participantUID: contactData[1].UID
    })
  })
  return fetchedGroups
}

async function syncUserGroups(UID, socket) {
  if (!UID && !socket) return false
  let fetchedInstances = null
  if (!UID) {
    const socketInstance = instanceHandler.getInstancesBySocket(socket)
    if (socketInstance) {
      UID = socketInstance.UID
      fetchedInstances = socketInstance.instances
    }
  } else {
    fetchedInstances = instanceHandler.getInstancesByUID(UID)
  }
  if (!fetchedInstances) return false

  const fetchedGroups = await getUserGroups(UID)
  if (!fetchedGroups) return false
  Object.entries(fetchedInstances).forEach(function(clientInstance) {
    clientInstance[1].emit("App:Groups:Personal:onSync", fetchedGroups)
    fetchedGroups.forEach(function(groupData) {
      clientInstance[1].join(databaseHandler.instances.personalGroups.prefix + "_" + groupData.UID)
      //clientInstance[1].emit("App:Groups:Personal:onSyncMessages", groupData) TODO: LOAD OLD MSGES
    })
  })
  return true
}
eventServer.on("App:Groups:Personal:onSync", syncUserGroups)


/*----------------------------
-- Event: On Client Connect --
----------------------------*/

eventServer.on("App:onClientConnect", function(socket, UID, socketServer) {
  socket.on("App:Group:Personal:onClientSendMessage", async function(messageData) {
    if (!messageData || !messageData.UID || !messageData.message || (typeof(messageData.message) != "string") || (messageData.message.length <= 0)) return false
    const client_instance = instanceHandler.getInstancesBySocket(this)
    if (!client_instance || !await databaseHandler.instances.users.functions.isUserExisting(client_instance.UID)) return false

    const queryResult = await databaseHandler.instances.personalGroups.dependencies.messages.functions.createMessage(databaseHandler.instances.personalGroups.functions.getDependencyREF("messages", messageData.UID), {
      message: messageData.message,
      owner: client_instance.UID
    })
    if (queryResult) {
      socketServer.of("/app").to(databaseHandler.instances.personalGroups.prefix + "_" + messageData.UID).emit("App:Groups:Personal:onSyncMessages", {
        UID: messageData.UID,
        messages: [queryResult]
      })
    }
    return true
  })
})

module.exports = {
  getUserGroups,
  syncUserGroups
}
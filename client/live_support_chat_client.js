// LIVE SUPPORT CHAT FOR THE CLIENT - Implementing the Bidirectional Streaming
// This part the client sends messages on the chat to the Activity Notification Service and receives responses from the support service.

const grpc = require("@grpc/grpc-js");

//Importing proto loader to be able to read the proto files
const protoLoader = require("@grpc/proto-loader");

//Importing the path to locate the files
const readline = require("readline");
const path = require("path");

const PROTO_PATH = path.join(__dirname, "../protos/activity_notification.proto");

//Loading the proto file definition
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const activityProto = grpc.loadPackageDefinition(packageDefinition).activitynotification;


// Creating client, using the list of address in: naming_service
const { getService } = require("../naming_service");
const client = new activityProto.ActivityNotificationService(
  getService("activityNotification"),
  grpc.credentials.createInsecure()
);

//Bidirectional streaming call
const call = client.LiveSupportChat();

// Receive messages from the server
call.on("data", (response) => {
  console.log(response.sender + ": " + response.messageText);
});

// Ending chat by the server
call.on("end", () => {
  console.log("Chat ended by server.");
});

// Error handling
call.on("error", (error) => {
  console.error("Error:", error.message);
});

// Reading the user input from terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout});

console.log("Live Support Chat started.");
console.log("Please, type a message and press Enter. Type 'exit' to end the chat.");

rl.on("line", (messageText) => {
  if (messageText.toLowerCase() === "exit") {
    call.end();
    rl.close();
  } else {
    call.write({
      userId: 1,
      messageText: messageText,
      sender: "user"
    });
  }
});
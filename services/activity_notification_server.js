// ACTIVITY NOTIFICATION SERVICE - Client-side Streaming
//This service receives multiple user activities from the client and it will return a summary at the end

const grpc =require("@grpc/grpc-js");

// Importing proto loader to read proto files
const protoLoader =require("@grpc/proto-loader");

//Importing path to be able to locate files
const path =require("path");
const PROTO_PATH = path.join(__dirname, "../protos/activity_notification.proto");

//Loading the proto file definition
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const activityProto = grpc.loadPackageDefinition(packageDefinition).activitynotification;

// Below is the implementation of the client-side streaming RPC
function uploadUserActivity(call, callback){
    let totalActivities = 0;
    let totalScore = 0;

// Reading metadata sent by the client
const clientVersion = call.metadata.get("client-version");
const requestTimestamp = call.metadata.get("timestamp");
  console.log("Metadata received - Client version:", clientVersion, "| Timestamp:", requestTimestamp);
 
// Every time the client sends a new activity, this runs
  call.on("data", (activity) => {
  totalActivities++;
 
    // Validation using gRPC status codes
    // if invalid then "INVALID_ARGUMENT" will be shown
    if (activity.userId <= 0) {
      callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "Sorry, The User ID is invalid! Please enter a positive number."
      });
      return;
    }

// Add the score if the activity has one
    if (activity.score) {totalScore += activity.score;
    }
    console.log("Thank you, your submission was received. Activity:", activity);
  });

// When the client finishes sending the data, the score level will be checked
    call.on("end", () => { let averageScore = 0;

    if (totalActivities > 0) {
      averageScore = Math.floor(totalScore / totalActivities);
    }

    // Simple badge logic
    let badge = "No Badge";

    if (averageScore >= 80) {
      badge = "Gold Learner";
    } else if (averageScore >= 50) {
      badge = "Silver Learner";
    } else if (averageScore > 0) {
      badge = "Bronze Learner";
    }

    // Send final response
    callback(null, {
        totalActivities: totalActivities,
        averageScore: averageScore,
        badgeEarned: badge,
        message: "You have completed " + totalActivities + " activities with an average score of " + averageScore + ". Keep it up!"
    });
  });

  // Error handling
  call.on("error", (error) => {
    console.error("Error:", error);
  });
}

// Below is the implementation of the bidirectional streaming RPC, so client can send and receive messages
function liveSupportChat(call){

// Reading metadata sent by the client
const clientVersion = call.metadata.get("client-version");
  console.log("Live Support Chat started - Client version:", clientVersion);
 
// The below will run every time the client sends a message on the chat
  call.on("data", (message) => {
    console.log("Your message was received:", message);
 
// Validation using gRPC status codes
  if (!message.messageText || message.messageText.trim() === "") {
    call.destroy({
      code: grpc.status.INVALID_ARGUMENT,
      message: "Message cannot be empty."
    });
    return;
  }

  // Response that will be sent back to the client
    call.write({
      userId: message.userId,
      messageText: "Support: We have received your message " + message.messageText,
      sender: "support"
    });
  });

// This runs when the client ends the chat
    call.on("end", () => {
    console.log("Chat ended");
    call.end();
  });
 
  // Error handling
  call.on("error", (error) => {
    console.error("Chat error:", error);
  });
 
  // Handling cancellation
  call.on("cancelled", () => {
    console.log("Chat was cancelled by the client");
  });
}

// Setting the server
//Creating a new gRPC server
const server = new grpc.Server();

server.addService(activityProto.ActivityNotificationService.service, {
  UploadUserActivity: uploadUserActivity,
  LiveSupportChat: liveSupportChat
});

// Port 50053 for this service
server.bindAsync(
  "0.0.0.0:50053",
  grpc.ServerCredentials.createInsecure(),
  function () {
    console.log("Activity Notification Service running on port 50053");
  }
);
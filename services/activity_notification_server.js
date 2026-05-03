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

// If condition, so every time it will run when the client send a new activity
call.on("data", (activity) => {
    totalActivities++;

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

  // The below will run every time the client sends a message on the chat
  call.on("data", (message) => {
    console.log("Your message was received:", message);

    // Response that will be sent back to the client
    call.write({
      userId: message.userId,
      messageText: "Support: We have received your message " + message.messageText,
      sender: "support"
    });
  });

  // This runs when the client ends the chat
  call.on("end", () =>{
    console.log("Chat ended");
    call.end();
  });

  // Error handling
  call.on("error", (error) =>{
    console.error("Error:", error);
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
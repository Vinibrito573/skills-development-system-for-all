// ACTIVITY NOTIFICATION CLIENT - Client-side Streaming
// This client sends multiple user activities to the server and receives a summary at the end

const grpc = require("@grpc/grpc-js");

//Importing gRPC library
const protoLoader = require("@grpc/proto-loader");

//Importing path to be able to locate files
const path =require("path");
const PROTO_PATH= path.join(__dirname, "../protos/activity_notification.proto");

//Loading the proto file definition
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const activityProto= grpc.loadPackageDefinition(packageDefinition).activitynotification;

// Creating client, using the list of address in: naming_service
const { getService } = require("../naming_service");
const client = new activityProto.ActivityNotificationService(
  getService("activityNotification"),
  grpc.credentials.createInsecure()
);

// Calling the client-side streaming RPC
const call = client.UploadUserActivity((error, response) => {
    if (error) {console.error("Error:", error);
  } else {
    console.log("Final Summary from server:");
    console.log(response);
  }
});

// Sending multiple activities
call.write({ userId: 1, activityType: "module", score: 80 });
call.write({ userId: 1, activityType: "quiz", score: 90 });
call.write({ userId: 1, activityType: "module", score: 70 });

// Finish sending
call.end();
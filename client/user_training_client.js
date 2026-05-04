//USER TRAINING CLIENT - Unary RPC
//This client connects to the User Training Service and sends a request to assign training to a user,
//and then receive and display the response.

//Importing gRPC library
const grpc = require("@grpc/grpc-js");

//Importing proto loader to be able to read the proto files
const protoLoader =require("@grpc/proto-loader");

//Importing the path to locate the files
const path = require("path");

const PROTO_PATH = path.join(__dirname, "../protos/user_training.proto");

//Proto file definition
const packageDefinition =protoLoader.loadSync(PROTO_PATH);

//Creating an object converting proto
const userTrainingProto=grpc.loadPackageDefinition(packageDefinition).usertraining;

//Setting Client
// Creating client, using the list of address in: naming_service
const { getService } = require("../naming_service");
const client = new userTrainingProto.UserTrainingService(
  getService("userTraining"),
  grpc.credentials.createInsecure()
);


//Below we will be requesting the data
const request = {
    userId: 1,
    dateOfBirth: "2000-07-07",
    employmentStatus: "unemployed",
    trainingTitle: "Basic Excel Skills",
    category: "Basic Skills",
    dueDate: "2026-05-07"
};

//Connecting RPC
//AssignTraining Method
client.AssignTraining(request,(error, response) =>{
    // If there is an error
    if (error) {
    console.error("Error:",error);
} 
  else { //for action completed correctly, then display the message
    console.log("Response from server:");
    console.log(response);
  }
});
var SERVER_NAME = 'patients-api'
var DEFAULT_PORT = 7000
var DEFAULT_HOST = '127.0.0.1'

var http = require ('http');
var mongoose = require ("mongoose");

var port = process.env.PORT;
var ipaddress = process.env.IP; // TODO: figure out which IP to use for the heroku

// Here we find an appropriate database to connect to, defaulting to
// localhost if we don't find one.  
var uristring = 
  process.env.MONGODB_URI || 
  'mongodb://localhost/patient-db';

// Makes connection asynchronously.  Mongoose will queue up database
// operations and release them when the connection is complete.
mongoose.connect(uristring, function (err, res) {
  if (err) { 
    console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  } else {
    console.log ('Successfully connected to: ' + uristring);
  }
});

// This is the schema.  Note the types, validation and trim
// statements.  They enforce useful constraints on the data.
var patientSchema = new mongoose.Schema({
		first_name: String, 
    last_name: String, 
    dob: String,
		address: String,
		department: String,
		doctor: String
});

// Compiles the schema into a model, opening (or creating, if
// nonexistent) the 'Patients' collection in the MongoDB database
var Patients = mongoose.model('Patient', patientSchema);

var restify = require('restify')

  // getting a persistence engine for the stories
  , patientsSave = require('save')('patients')

  // creating the restify server
  , server = restify.createServer({ name: SERVER_NAME})

  if (typeof ipaddress === "undefined") {
		//  Log errors on OpenShift but continue w/ 127.0.0.1 - this
		//  allows us to run/test the app locally.
		console.warn('No process.env.IP var, using default: ' + DEFAULT_HOST);
		ipaddress = DEFAULT_HOST;
	};

	if (typeof port === "undefined") {
		console.warn('No process.env.PORT var, using default port: ' + DEFAULT_PORT);
		port = DEFAULT_PORT;
	};

  server.listen(port, ipaddress, function () {
  console.log('Server %s listening at %s', server.name, server.url)
  console.log('Endpoints:')
  console.log(server.url+'/patients', 'To fetch all pateints(GET Method)')
  console.log(server.url+'/patients', 'To add patient(POST Method - with valid input)')
  console.log(server.url+'/patients/:id', 'To fetch single patient((GET Method)')  
  
})

server
  // allowing the use of POST
  .use(restify.fullResponse())

  // maping request.body to request.params so there is no switching between them
  .use(restify.bodyParser())

// method to get all patients
server.get('/patients', function (req, res, next) {

  console.log('GET request: patient');
    // Find every entity within the given collection
    Patients.find({}).exec(function (error, result) {
      if (error) return next(new restify.InvalidArgumentError(JSON.stringify(error.errors)))
      res.send(result);
    });
})

// Get a single patient by their user id
server.get('/patients/:id', function (req, res, next) {

  // Find a single patient  by their id within save
  patientsSave.findOne({ _id: req.params.id }, function (error, patient) {
    // If there are any errors, pass them to next in the correct format
    if (error) return next(new restify.InvalidArgumentError(JSON.stringify(error.errors)))

    if (patient) {
      // Send the patient if no issues
      res.send(patient)
    } else {
      // Send 404 header if the patient doesn't exist
      res.send(404)
    }
  })
})

// method to create a new patient
server.post('/patients', function (request, res, next) {
  
  // firstname is compulsory
  if (request.params.first_name === undefined ) {
    return next(new restify.InvalidArgumentError('FirstName must be supplied'))
  }

  // lastname is compulsory
  if (request.params.last_name === undefined ) {
    return next(new restify.InvalidArgumentError('LastName must be supplied'))
  }
  // dob is compulsory
  if (request.params.dob === undefined ) {
    return next(new restify.InvalidArgumentError('DOB must be supplied'))
  }
  // address is compulsory
  if (request.params.address === undefined ) {
    return next(new restify.InvalidArgumentError('Address must be supplied'))
  }

  // department is compulsory
  if (request.params.department === undefined ) {
    return next(new restify.InvalidArgumentError('department must be supplied'))
  }

  // doctor is compulsory
  if (request.params.doctor === undefined ) {
    return next(new restify.InvalidArgumentError('Doctor must be supplied'))
  }

  var newPatient = new Patients({
    first_name: request.params.first_name, 
    last_name: request.params.last_name,
    dob: request.params.dob,
    address: request.params.address,
    department: request.params.department,
    doctor: request.params.doctor
  });

 // Create the patient and saving to db
 newPatient.save(function (error, result) {

  // If there are any errors, pass them to next in the correct format
  if (error) return next(new restify.InvalidArgumentError(JSON.stringify(error.errors)))

  // Send the patient if no issues
  res.send(201, result)
})
})

// Delete patient with the given id
server.del('/patients/:id', function (req, res, next) {
  console.log('DEL request: patient/' + req.params.id);
  Patients.remove({ _id: req.params.id }, function (error, result) {
    // If there are any errors, pass them to next in the correct format
    if (error) return next(new restify.InvalidArgumentError(JSON.stringify(error.errors)))

    // Send a 200 OK response
    res.send()
  });
})

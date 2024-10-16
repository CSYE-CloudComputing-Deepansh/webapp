const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const { expect } = chai;
const userService = require('../../services/user-service.js'); // Import userService directly
const app = require('../../app.js'); // Import your Express app

chai.use(chaiHttp);

describe('POST /v1/user - User Creation', () => {
  let findUserStub, saveUserStub;

  beforeEach(() => {
    console.log("Setting up stubs...");

    // Stub methods directly on the userService
    findUserStub = sinon.stub(userService, 'findUser');
    saveUserStub = sinon.stub(userService, 'saveUser');

    console.log("Stubs set up.");
  });

  afterEach(() => {
    console.log("Restoring Sinon stubs...");
    sinon.restore(); // Restore all stubs after each test
  });

  it('should return 400 if required fields are missing', (done) => {
    console.log("Running test for missing fields...");
    const incompleteUser = {
      first_name: 'John',
      email: 'john.doe@example.com', // Missing last_name and password
    };

    chai
      .request(app)
      .post('/v1/user')
      .send(incompleteUser)
      .end((err, res) => {
        console.log("Test response received.");
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message', 'All fields needed');
        done();
      });
  });

  it('should return 400 if the user already exists', (done) => {
    console.log("Running test for existing user...");
    const existingUser = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      password: 'hashedpassword',
    };

    // Stub findUser to return an existing user
    findUserStub.resolves(existingUser);

    chai
      .request(app)
      .post('/v1/user')
      .send(existingUser)
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message', 'User already exists');
        done();
      });
  });

  it('should create a new user and return 201', (done) => {
    console.log("Running test for user creation...");
    const newUser = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
    };

    const createdUser = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      account_created: new Date(),
      account_updated: new Date(),
    };

    findUserStub.resolves(null); // Make the stub return no user
    saveUserStub.resolves(createdUser); // Make the stub simulate successful user creation

    chai
      .request(app)
      .post('/v1/user')
      .send(newUser)
      .end((err, res) => {
        expect(res).to.have.status(205);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('id', createdUser.id);
        expect(res.body).to.have.property('email', createdUser.email);
        expect(res.body).to.have.property('first_name', createdUser.first_name);
        expect(res.body).to.have.property('last_name', createdUser.last_name);
        expect(res.body).to.have.property('account_created');
        expect(res.body).to.have.property('account_updated');
        done();
      });
  });
});

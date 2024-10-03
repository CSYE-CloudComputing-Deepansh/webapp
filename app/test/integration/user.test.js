import { expect } from 'chai';
import sinon from 'sinon';

// The Babel plugin allows direct use of __Rewire__ without the need for 'rewire' import
import * as userController from '../../controllers/user-controller.js';  // Assuming this is the correct path
console.log(userController);
describe('User Controller Tests', () => {
  let findUserStub, saveUserStub, req, res, next;

  beforeEach(() => {
    req = { body: {}, user: {} };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
      set: sinon.stub().returnsThis(),
    };
    next = sinon.stub();

    // Use __Rewire__ to replace internal dependencies
    findUserStub = sinon.stub();
    saveUserStub = sinon.stub();

    userController.__Rewire__('findUser', findUserStub);
    userController.__Rewire__('saveUser', saveUserStub);
  });

  afterEach(() => {
    // Restore Sinon stubs and reset rewired modules
    sinon.restore();
    userController.__ResetDependency__('findUser');
    userController.__ResetDependency__('saveUser');
  });

  it('should return 400 if required fields are missing', async () => {
    req.body = { first_name: 'John', last_name: 'Doe' };  // Missing email and password

    await userController.saveUser(req, res);

    expect(res.status).to.have.been.calledWith(400);
    expect(res.json).to.have.been.calledWith({ message: 'All fields needed' });
  });

  it('should create a new user and return 201', async () => {
    req.body = { first_name: 'John', last_name: 'Doe', email: 'john@example.com', password: 'password' };

    // Simulate user does not exist
    findUserStub.resolves(null);

    // Simulate successful user creation
    const createdUser = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      account_created: new Date(),
      account_updated: new Date(),
    };
    saveUserStub.resolves(createdUser);

    await userController.saveUser(req, res);

    expect(res.status).to.have.been.calledWith(201);
    expect(res.set).to.have.been.calledWith('authorization');
    expect(res.json).to.have.been.calledWith({
      id: createdUser.id,
      email: createdUser.email,
      first_name: createdUser.first_name,
      last_name: createdUser.last_name,
      account_created: createdUser.account_created,
      account_updated: createdUser.account_updated,
    });
  });

  // Additional tests...
});

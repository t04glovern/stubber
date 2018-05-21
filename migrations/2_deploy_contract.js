var StubToken = artifacts.require("StubToken");

module.exports = function(deployer) {
  deployer.deploy(StubToken, 'StubToken', 'STUB');
};

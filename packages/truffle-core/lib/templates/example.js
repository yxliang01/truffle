const Example = artifacts.require("Example");

contract("Example", function() {
  it("should assert true", function(done) {
    Example.deployed();
    assert.isTrue(true);
    done();
  });
});

var Client = require("../../lib/dynode/client").Client,
    DynamoDB = require('../test-helper'),
    util = require('utile'),
    should = require('should');

describe("DynamoDB Client unit tests", function(){
  var realRequest,
      client;

  beforeEach(function() {
    client = DynamoDB.client;
    realRequest = client._request;
  });

  afterEach(function() {
    client._request = realRequest;
  });

  describe("Create Table", function() {

    it('should create table with defaults', function(done) {
      client._request = function(action, options, cb) {
        action.should.equal("CreateTable");
        options.TableName.should.equal("CreateThisTable");
        options.KeySchema.HashKeyElement.should.eql({ AttributeName: 'id', AttributeType: 'S' });
        options.ProvisionedThroughput.should.eql({ ReadCapacityUnits: 10, WriteCapacityUnits: 5 });

        cb();
      };

      client.createTable("CreateThisTable", done);
    });

    it('should create table with custom read and write throughput', function(done) {
      client._request = function(action, options, cb) {
        options.ProvisionedThroughput.should.eql({ ReadCapacityUnits: 4, WriteCapacityUnits: 3 });
        cb();
      };

      client.createTable("TestTable", {read: 4, write: 3}, done);
    });

    it('should create table with custom keys', function(done) {
      client._request = function(action, options, cb) {
        options.KeySchema.HashKeyElement.should.eql({ AttributeName: 'age', AttributeType: 'N' });
        options.KeySchema.RangeKeyElement.should.eql({ AttributeName: 'name', AttributeType: 'S' });
        cb();
      };

      client.createTable("TestTable", {hash:{age: Number}, range: {name: String}}, done);
    });
  });

  describe("Describe Table", function() {
    it('should make describe table request', function(done) {
      client._request = function(action, options, cb) {
        action.should.equal("DescribeTable");
        options.TableName.should.equal("TestTable");

        cb(null, {});
      };

      client.describeTable("TestTable", done);
    });
  });  
  
  describe("List Tables", function() {
    it('should make request to list all tables', function(done) {
      client._request = function(action, options, cb) {
        action.should.equal("ListTables");
        options.should.eql({});
        cb();
      };

      client.listTables(done);
    });

    it('should make request with given options', function(done) {
      client._request = function(action, options, cb) {
        action.should.equal("ListTables");
        options.should.eql({Limit: 4, ExclusiveStartTableName: "SomeTable"});
        
        cb();
      };

      client.listTables({Limit: 4, ExclusiveStartTableName: "SomeTable"}, done);
    });
  });

  describe("Delete Table", function() {
    it('should delete the table', function(done) {
      client._request = function(action, options, cb) {
        action.should.equal("DeleteTable");
        options.TableName.should.equal("TableToDelete");

        cb();
      };

      client.deleteTable("TableToDelete", done);
    });

  });

  describe("Update Table", function() {
    it('should update tables provisioned throughput ', function(done) {
      client._request = function(action, options, cb) {
        action.should.equal("UpdateTable");
        options.TableName.should.equal("UpdateThisTable");
        options.ProvisionedThroughput.should.eql({ ReadCapacityUnits: 5, WriteCapacityUnits: 2 });

        cb();
      };

      client.updateTable("UpdateThisTable",  {read: 5, write: 2}, done);
    });

  });

  describe("Put Item", function() {
    it('should make request to save simple item', function(done) {
      var item = {id : "Foo", age : 22};

      client._request = function(action, options, cb) {
        action.should.equal("PutItem");
        options.TableName.should.equal("TestTable");
        options.Item.should.eql({id: { S: 'Foo' }, age: { N: '22' } });

        cb();
      };

      client.putItem("TestTable", item, done);
    });

    it('should make request to save complex item', function(done) {
      var item = {id : 99, nums : [22, 33, 44], terms : ["foo", "bar", "baz"]};

      client._request = function(action, options, cb) {
        action.should.equal("PutItem");
        options.TableName.should.equal("TestTable");
        
        options.Item.should.eql({
          id    : { N: '99' },
          nums  : { NS: ['22', '33', '44']}, 
          terms : { SS: ["foo", "bar", "baz"]}
        });

        cb();
      };

      client.putItem("TestTable", item, done);
    });

    it('should make request with given options', function(done) {
      var item = {id : "blah"};

      client._request = function(action, options, cb) {
        action.should.equal("PutItem");
        options.TableName.should.equal("TestTable");
        options.ReturnValues.should.equal("ALL_OLD");
        options.Item.should.eql({id: { S: 'blah' }});
        
        cb();
      };

      client.putItem("TestTable", item,{ReturnValues:"ALL_OLD"}, done);
    });

  });

  describe("Update Item", function() {
    it('should make request to update item', function(done) {
      var updates = {age : 22};

      client._request = function(action, options, cb) {
        action.should.equal("UpdateItem");
        options.TableName.should.equal("TestTable");
        options.Key.should.eql({HashKeyElement: { S :"My-Key"}});

        options.AttributeUpdates.should.eql({"age":{"Value":{"N":"22"},"Action":"PUT"}});

        cb();
      };

      client.updateItem("TestTable", "My-Key", updates, done);
    });

    it('should make request to update item by composite key', function(done) {
      var updates = {age : 22};

      client._request = function(action, options, cb) {
        action.should.equal("UpdateItem");
        options.TableName.should.equal("TestTable");
        options.Key.should.eql({HashKeyElement: { S :"My-Key"}, RangeKeyElement: { N :"123"} });

        cb();
      };

      client.updateItem("TestTable", {hash: "My-Key",range: 123} , updates, done);
    });

    it('should mix in options to the request', function(done) {
      var updates = {age : 22},
      opts = {"Expected":{"foo":{"Value":{"S":"bar"}}}};

      client._request = function(action, options, cb) {
        action.should.equal("UpdateItem");
        options.TableName.should.equal("TestTable");
        options.Expected.should.eql({"foo":{"Value":{"S":"bar"}}});
        
        cb();
      };

      client.updateItem("TestTable", "somekey" , updates, opts, done);
    });

  });

  describe("Get Item", function() {

    it("should get item by hash key", function(done){
      client._request = function(action, options, cb) {
        action.should.equal("GetItem");
        options.Key.should.eql({HashKeyElement: { S :"somekey"}});

        done();
      };

      client.getItem("TestTable", "somekey", done);

    });

    it("should get item by composite key", function(done){
      client._request = function(action, options, cb) {
        action.should.equal("GetItem");
        options.Key.should.eql({HashKeyElement: { N :"123"}, RangeKeyElement: { S :"blah"} });

        done();
      };

      client.getItem("TestTable", {hash: 123, range: "blah"}, done);

    });

    it("should make request with given options", function(done){
      client._request = function(action, options, cb) {
        action.should.equal("GetItem");
        options.Key.should.eql({HashKeyElement: { S :"somekey"}});
        options.ConsistentRead.should.be.true;
        options.AttributesToGet.should.eql(["name", "age"]);

        done();
      };

      client.getItem("TestTable", "somekey",{ConsistentRead: true, "AttributesToGet":["name","age"],}, done);

    });

  });

  describe("Delete Item", function() {

    it("should make request to delete item by hash key", function(done){
      client._request = function(action, options, cb) {
        action.should.equal("DeleteItem");
        options.Key.should.eql({HashKeyElement: { S :"somekey"}});

        done();
      };

      client.deleteItem("TestTable", "somekey", done);

    });

    it("should make request to delete item by composite key", function(done){
      client._request = function(action, options, cb) {
        action.should.equal("DeleteItem");
        options.Key.should.eql({HashKeyElement: { S :"somekey"}, RangeKeyElement: { S :"foo"}});

        done();
      };

      client.deleteItem("TestTable", {hash: "somekey", range: "foo"}, done);
    });

    it("should make request to delete item with options", function(done){
      client._request = function(action, options, cb) {
        action.should.equal("DeleteItem");
        options.Key.should.eql({HashKeyElement: { S :"somekey"}});
        options.ReturnValues.should.equal("ALL_OLD");

        done();
      };

      client.deleteItem("TestTable", "somekey",{ReturnValues : "ALL_OLD"}, done);

    });
  });

  describe("Query", function() {
    it("should make query request with string hash key", function(done){
      client._request = function(action, options, cb) {
        action.should.equal("Query");
        options.TableName.should.eql("QueryTable");
        options.HashKeyValue.should.eql({"S":"my-key"});

        cb(null, {});
      };

      client.query("QueryTable", "my-key", done);
    });

    it("should make query request with number hash key", function(done){
      client._request = function(action, options, cb) {
        action.should.equal("Query");
        options.TableName.should.eql("QueryTable");
        options.HashKeyValue.should.eql({"N":"33"});

        done();
      };

      client.query("QueryTable", 33);
    });

    it("should make query request with options", function(done){
      client._request = function(action, options, cb) {
        action.should.equal("Query");
        options.TableName.should.eql("QueryTable");
        options.RangeKeyCondition.should.eql({"AttributeValueList":[{"N":"AttributeValue2"}],"ComparisonOperator":"GT"});
        options.Limit.should.equal(13);
        
        cb();
      };

      client.query("QueryTable", "thiskey",{Limit: 13,RangeKeyCondition: {AttributeValueList:[{"N":"AttributeValue2"}],"ComparisonOperator":"GT"}}, done );
    });

  });

  describe("Scan", function() {
    it("should make scan request with options", function(done){
      client._request = function(action, options, cb) {
        action.should.equal("Scan");
        options.TableName.should.eql("TestTable");
        options.Limit.should.equal(2);

        cb(null, {});
      };

      client.scan("TestTable", {Limit : 2}, done);
    });

    it("should convert returned items to json", function(done){
      client._request = function(action, options, cb) {
        action.should.equal("Scan");
        options.TableName.should.eql("TestTable");

        cb(null, {Items: [{"name":{"S":"Ryan"}}, {"name":{"S":"Bob"}}] });
      };

      client.scan("TestTable", {Limit : 2}, function(err, items) {
        items.should.have.lengthOf(2);
        items[0].should.eql({name: "Ryan"});
        items[1].should.eql({name: "Bob"});
        done();
      });

    });

  });

  describe("DynamoErrors", function() {
    // see https://github.com/Tim-Smart/express-aid/blob/master/index.js#L66-113
    // http://docs.amazonwebservices.com/amazondynamodb/latest/developerguide/ErrorHandling.html
    it('should handle all the various types of errors that DynamoDB can return');
  });
});
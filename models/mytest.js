'use strict';
module.exports = function(sequelize, DataTypes) {
  var MyTest = sequelize.define('MyTest', {
    name: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return MyTest;
};
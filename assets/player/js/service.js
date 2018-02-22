myApp = angular.module('starter');

myApp.service("selectPlayer", function () {
  this.currentPlayer = $.jStorage.get("player");
  this.setPlayer = function (playerId) {
    $.jStorage.set("player", playerId);
    this.currentPlayer = playerId;
  };
  this.getPlayer = function () {
    return this.currentPlayer;
  };
});
myApp.factory('apiService', function ($http, $q, $timeout) {


  return {
    // This is a demo Service for POST Method.
    callApiWithData: function (url, data, callback) {
      $http.post(adminurl + url, data).then(function (data) {
        callback(data);
      });
    },
    getAll: function (callback) {
      $http.post(adminurl + 'Player/getAll').then(function (data) {
        callback(data.data.data);
      });
    },
    showWinner: function (callback) {
      $http.post(adminurl + 'Player/showWinner').then(function (data) {
        callback(data);
      });

    },
    moveTurn: function (callback) {
      $http.post(adminurl + 'Player/moveTurn').then(function (data) {
        callback(data);
      });

    },
    call: function (callback) {
      $http.post(adminurl + 'Player/call').then(function (data) {
        callback(data);
      });

    },
    check: function (callback) {
      $http.post(adminurl + 'Player/check').then(function (data) {
        callback(data);
      });

    },
    fold: function (callback) {
      $http.post(adminurl + 'Player/fold').then(function (data) {
        callback(data);
      });
    },
    allIn: function (callback) {
      $http.post(adminurl + 'Player/allIn').then(function (data) {
        callback(data);
      });
    },
    raise: function (callback) {
      $http.post(adminurl + 'Player/raise').then(function (data) {
        callback(data);
      });
    },
    getAdminUrl: function () {
      return $.jStorage.get("adminurl");
    },
    saveAdminUrl: function (adminurl) {
      $.jStorage.set("adminurl", adminurl);
    }
  };
});

myApp.directive('card', function () {
  return {
    restrict: 'E',
    replace: false,
    scope: {
      card: "@",
      width: "@",
      height: "@"
    },
    templateUrl: 'templates/directive/card.html',
    link: function ($scope, element, attr) {
      function calc() {
        $scope.style = {
          width: $scope.width + "px",
          height: $scope.height + "px"
        };
        $scope.cardFile = "img/cards/" + _.toUpper($scope.card) + ".svg";
      }
      calc();
      $scope.$watch("card", function () {
        calc();
      });


    }
  };
});

myApp.directive('community', function () {
  return {
    restrict: 'E',
    replace: false,
    scope: {
      communityCard: "=ngCommunityCard"
    },
    templateUrl: 'templates/directive/communityCard.html',
    link: function ($scope, element, attr) {

    }
  };
});

myApp.directive('winnerPlayer', function () {
  return {
    restrict: 'E',
    replace: false,
    scope: {
      player: "=ngPlayer",
      method: "="
    },
    templateUrl: 'templates/directive/winnerPlayer.html',
    link: function ($scope, element, attr) {}
  };
});

myApp.directive('player', function ($ionicGesture) {
  return {
    restrict: 'E',
    replace: false,
    scope: {
      player: "=ngPlayer"
    },
    templateUrl: 'templates/directive/player.html',
    link: function ($scope, $element, attr) {
      $scope.isStack = {
        value: false
      };
      $scope.toggleStack = function () {
        $scope.isStack.value = !$scope.isStack.value;
      };
    }
  };
});

var i = 0;
myApp.directive('animatedCard', function ($ionicGesture, $timeout) {
  return {
    restrict: 'E',
    replace: false,
    scope: true,
    templateUrl: 'templates/directive/animatedCard.html',
    link: function ($scope, $element, $attr) {
      var distanceDifference = 0;
      var event = {
        gesture: {
          distance: 0
        }
      };
      $scope.card = $attr.card;
      var cardHeight = 300;
      var topMargin = 0;
      var maxDragPercent = 60;
      $timeout(function () {
        var cardImage = $($element).find("card.animatedCard img").get(0);
        var cardImageOpen = $($element).find("card.animatedCardOpen img").get(0);

        var parentImage = $($element).find("card.animatedCard").get(0);
        var parentImageOpen = $($element).find("card.animatedCardOpen").get(0);
        cardImage.addEventListener('touchstart', function (e) {
          distanceStart = e.changedTouches[0].clientY;
        }, false);

        cardImage.addEventListener('touchmove', function (e) {
          distanceDifference = distanceStart - e.changedTouches[0].clientY;
          event.gesture.distance = distanceDifference;
          var upDistance = event.gesture.distance * -1;
          var amountUp = (cardHeight - upDistance);
          if (upDistance >= 0) {
            var dragPercent = upDistance / cardHeight * 100;
            if (dragPercent < maxDragPercent) {
              var topPosition = (cardHeight - (1 * upDistance));
              $(parentImage).css("height", amountUp + "px");
              $(parentImage).css("top", upDistance + "px");
              $(parentImageOpen).css("height", upDistance + "px");
              $(parentImageOpen).css("top", (topPosition + topMargin) + "px");
              $scope.$apply();
            }
          }

        }, false);
        cardImage.addEventListener('touchend', function (e) {
          event.gesture.distance = 0;
          $(parentImage).css("height", cardHeight + "px");
          $(parentImageOpen).css("height", "0px");
          $(parentImage).css("top", 0 + "px");
          $(parentImageOpen).css("top", cardHeight + topMargin + "px");
          $scope.$apply();
        }, false);
      }, 200);


    }
  };

});



myApp.directive('animatedCardStack', function ($ionicGesture) {
  return {
    restrict: 'E',
    replace: false,
    scope: {
      player: "="
    },
    templateUrl: 'templates/directive/animatedCardStack.html',
    link: function ($scope, $element, attr) {
      $scope.card = attr.card;
      var cardHeight = 300;
      var topMargin = 0;
      var maxDragPercent = 60;
      $scope.player.dragCss = {
        width: "100%",
        overflow: "hidden",
        top: "0px"
      };
      $scope.player.dragCssOpen = {
        width: "100%",
        overflow: "hidden",
        height: "0px"
      };
      this.onDrag = function (event) {
        if (!$scope.player.dragCss) {
          $scope.player.dragCss = {
            width: "100%",
            overflow: "hidden",
          };
          $scope.player.dragCssOpen = {
            width: "100%",
            overflow: "hidden",
            height: "0px"
          };
        }
        var upDistance = event.gesture.distance;
        var amountUp = (cardHeight - upDistance);
        var dragPercent = upDistance / cardHeight * 100;
        if (dragPercent < maxDragPercent) {
          var topPosition = (cardHeight - (1 * upDistance));
          $scope.player.dragCss.height = amountUp + "px";
          $scope.player.dragCss.top = upDistance + "px";
          $scope.player.dragCssOpen.height = upDistance + "px";
          $scope.player.dragCssOpen.top = (topPosition + topMargin) + "px";
          $scope.$apply();
        }
      };
      this.onDragEnd = function (event) {
        if (!$scope.player.dragCss) {
          $scope.player.dragCss = {
            width: "100%",
            overflow: "hidden",
          };
          $scope.player.dragCssOpen = {
            width: "100%",
            overflow: "hidden",
            height: "0px"
          };
        }
        $scope.player.dragCss.height = cardHeight + "px";
        $scope.player.dragCss.top = "0px";
        $scope.player.dragCssOpen.height = "0px";
        $scope.player.dragCssOpen.top = cardHeight + topMargin + "px";
        $scope.$apply();
      };
      $ionicGesture.on('dragdown', this.onDrag, $element);
      $ionicGesture.on('dragend', this.onDragEnd, $element);

    }
  };
});
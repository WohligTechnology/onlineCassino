var playerCtrlSocket = {};
var winnerCtrlSocket = {};

angular.module('starter.controllers', [])

  .controller('AppCtrl', function ($scope, $ionicModal, $timeout) {})

  .controller('PlayerCtrl', function ($scope, $stateParams, selectPlayer, apiService, $interval, $state, $ionicModal, $timeout) {

    io.socket.off("Update", winnerCtrlSocket.update);

    playerCtrlSocket.update = function (data) {
      compileData(data);
      $scope.$apply();
    };
    io.socket.on("Update", playerCtrlSocket.update);

    $scope.getTabDetail = function () {
      apiService.getAll(compileData);
    };
    $scope.getTabDetail();


    function compileData(data) {
      $scope.player = _.find(data.playerCards, function (player) {
        return player.playerNo == selectPlayer.getPlayer();
      });
      $scope.communityCards = data.communityCards;
      $scope.remainingPlayer = _.filter(data.playerCards, function (player) {
        return player.isActive && !player.isFold;
      }).length;
      if (!$scope.player) {
        $state.go("tab");
      }
      if (data.isCheck) {
        $scope.isCheck = true;
      } else {
        $scope.isCheck = false;
      }
      if (data.newGame) {
        $scope.removeWinner();
      }
    }

    $scope.raise = function () {
      $scope.player.isTurn = false;
      apiService.raise(function (data) {});
    };
    $scope.allIn = function () {
      $scope.player.isTurn = false;
      apiService.allIn(function (data) {});
    };
    $scope.call = function () {
      $scope.player.isTurn = false;
      apiService.call(function (data) {});
    };
    $scope.check = function () {
      $scope.player.isTurn = false;
      apiService.check(function (data) {});
    };
    $scope.fold = function () {
      $scope.player.isTurn = false;
      apiService.fold(function (data) {});
    };
    $ionicModal.fromTemplateUrl('templates/winner.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modal = modal;
    });

    $scope.showWinnerSocket = function (data) {
      console.log(data);
      if (!($scope.player.isFold || !$scope.player.isActive)) {
        if (!$scope.modal._isShown) {
          $scope.modal.show();
        }
        var isWinner = _.find(data.data, function (n) {
          return (n.playerNo == selectPlayer.getPlayer()) && n.winner;
        });
        if (isWinner) {
          $scope.isWinner = "You Won";
        } else {
          $scope.isWinner = "You Lose";
        }
      }
    };
    $scope.removeWinner = function () {
      $scope.modal.hide();
    };

    $scope.closeModal = function () {
      $scope.modal.hide();
    };

    io.socket.on("ShowWinner", $scope.showWinnerSocket);

  })
  .controller('TabCtrl', function ($scope, $stateParams, selectPlayer, apiService, $state) {
    $scope.players = ["1", "2", "3", "4", "5", "6", "7", "8"];
    $scope.form = {};
    $scope.form.adminurl = apiService.getAdminUrl();
    $scope.form.player = selectPlayer.getPlayer();
    $scope.saveForm = function () {
      apiService.saveAdminUrl($scope.form.adminurl);
      selectPlayer.setPlayer($scope.form.player);
      window.location.href = window.location.href.split("#")[0];
    };
  })
  .controller('PlaylistCtrl', function ($scope, $stateParams) {})
  .controller('AnimatedCardCtrl', function ($scope, $stateParams, $element, $attr, $timeout) {

    // $ionicGesture.on('dragup', this.onDrag, $element);
    // $ionicGesture.on('dragend', this.onDragEnd, $element);

  });
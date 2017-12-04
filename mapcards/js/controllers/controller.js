var updateSocketFunction = {};
var allIntervals = [];
myApp.controller('HomeCtrl', function ($scope, TemplateService, NavigationService, apiService, $uibModal, $timeout, toastr, $interval) {
    var changingCardTime = 2000;
    var retryApiTime = 1000;
    var savingCardInterval, verifingCardInterval, nextCardInterval;
    $scope.template = TemplateService.getHTML("content/home.html");
    $scope.navigation = NavigationService.getNavigation();
    TemplateService.title = "Home"; //This is the Title of the Website
    $scope.allCards = TemplateService.getAllCard();
    $scope.mapCard = {
        selected: _.head($scope.allCards),
        isSaving: "",
        isVerifing: "",
        isNextCard: ""
    };

    $scope.savingCard = function () {
        $scope.mapCard.isSaving = "Pending";
        var intervalObj = $interval(function () {
            $scope.mapCard.isSaving = "Complete";
            $scope.stopAll();
            $scope.verifingCard();
        }, retryApiTime);
        allIntervals.push(intervalObj);
    };

    $scope.verifingCard = function () {
        $scope.mapCard.isVerifing = "Pending";
        var intervalObj = $interval(function () {
            $scope.mapCard.isVerifing = "Complete";
            $scope.stopAll();
            $scope.nextCard();
        }, retryApiTime);
        allIntervals.push(intervalObj);
    };

    $scope.nextCard = function () {
        $scope.mapCard.isNextCard = "Pending";
        var intervalObj = $interval(function () {
            $scope.mapCard.isNextCard = "Complete";
            $scope.stopAll();
            $scope.changeCard();
        }, changingCardTime);
        allIntervals.push(intervalObj);
    };

    $scope.changeCard = function () {
        var indexCard = _.findIndex($scope.allCards, function (n) {
            return n.shortName == $scope.mapCard.selected.shortName;
        });
        if (indexCard == ($scope.allCards.length - 1)) {
            $scope.completedDeck = true;
            toastr.success("Desk Mapping Completed");
        } else {
            $scope.mapCard.selected = $scope.allCards[++indexCard];
            $scope.mapCard.isSaving = "";
            $scope.mapCard.isVerifing = "";
            $scope.mapCard.isNextCard = "";
            $scope.savingCard();
        }
    };

    $scope.stopAll = function () {
        _.each(allIntervals, function (n) {
            $interval.cancel(n);
        });
        $scope.allIntervals = [];
    };



    //initializing all calls
    $scope.restartApp = function () {
        $scope.stopAll();
        $scope.savingCard();
        $scope.mapCard.isSaving = "";
        $scope.mapCard.isVerifing = "";
        $scope.mapCard.isNextCard = "";
    };
    $scope.restartApp();

});
myApp.controller('ReadCtrl', function ($scope, TemplateService, NavigationService, apiService, $uibModal, $timeout, toastr, $interval) {
    var changingCardTime = 2000;
    var retryApiTime = 1000;
    var savingCardInterval, verifingCardInterval, nextCardInterval;
    $scope.template = TemplateService.getHTML("content/read.html");
    $scope.navigation = NavigationService.getNavigation();
    TemplateService.title = "Navigation"; //This is the Title of the Website
    $scope.allCards = TemplateService.getAllCard();
    $scope.mapCard = {
        selected: {
            shortName: "NONE"
        },
        isSaving: "",
        isVerifing: "",
        isNextCard: ""
    };

    $scope.startReading = function () {
        var intervalObj = $interval(function () {
            console.log("Called");
        }, 1000);
        allIntervals.push(intervalObj);
    };



    $scope.stopAll = function () {
        _.each(allIntervals, function (n) {
            $interval.cancel(n);
        });
        $scope.allIntervals = [];
    };



    //initializing all calls
    $scope.restartApp = function () {
        $scope.stopAll();
        $scope.startReading();
    };
    $scope.restartApp();

});
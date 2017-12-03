var updateSocketFunction = {};
myApp.controller('HomeCtrl', function ($scope, TemplateService, NavigationService, apiService, $uibModal, $timeout, toastr) {
    var changingCardTime = 2000;
    var retryApiTime = 1000;
    $scope.template = TemplateService.getHTML("content/home.html");
    TemplateService.title = "Home"; //This is the Title of the Website
    TemplateService.header = ""; //This is the Title of the Website
    TemplateService.footer = ""; //This is the Title of the Website
    $scope.allCards = TemplateService.getAllCard();
    $scope.mapCard = {
        selected: _.head($scope.allCards),
        isSaving: "",
        isVerifing: "",
        isNextCard: ""
    };

    $scope.savingCard = function () {
        $scope.mapCard.isSaving = "Pending";
        $timeout(function () {
            $scope.mapCard.isSaving = "Complete";
            $scope.verifingCard();
        }, retryApiTime);

    };

    $scope.verifingCard = function () {
        $scope.mapCard.isVerifing = "Pending";
        $timeout(function () {
            $scope.mapCard.isVerifing = "Complete";
            $scope.nextCard();
        }, retryApiTime);
    };

    $scope.nextCard = function () {
        $scope.mapCard.isNextCard = "Pending";
        $timeout(function () {
            $scope.mapCard.isNextCard = "Complete";
            $scope.changeCard();
        }, changingCardTime);

    };

    $scope.changeCard = function () {
        console.log($scope.allCards[0]);
        var indexCard = _.findIndex($scope.allCards, function (n) {
            return n.shortName == $scope.mapCard.selected.shortName;
        });
        console.log(indexCard);
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



    //initializing all calls
    $scope.savingCard();
});
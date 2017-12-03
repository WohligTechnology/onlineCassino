var updateSocketFunction = {};
myApp.controller('HomeCtrl', function ($scope, TemplateService, NavigationService, $timeout, apiService, $uibModal) {
    $scope.template = TemplateService.getHTML("content/home.html");
    TemplateService.title = "Home"; //This is the Title of the Website
    TemplateService.header = ""; //This is the Title of the Website
    TemplateService.footer = ""; //This is the Title of the Website
    $scope.allCards = TemplateService.getAllCard();
    $scope.mapCard = {
        selected: _.head($scope.allCards)
    };
});
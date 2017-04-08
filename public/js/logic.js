var app = angular.module("aApplication", [])
    .controller("search-controller", function ($scope, $rootScope, ajaxLogic) { //search controller
        $scope.searchKeyword = function () {
            ajaxLogic.getDocuments($scope.searchInput, function (res) {
                $rootScope.$broadcast("gotAjaxData", res); // rootScope 로 부터 하위 컨트롤러로 event 발생.
            });
        };
    })
    .controller("main-controller", function ($scope, ajaxLogic) { // main controller
        $scope.ajaxResult = [];
        $scope.$on("gotAjaxData", function (e, res) {
            $scope.ajaxResult = res;
        })
    })
    .controller("write-controller", function ($scope, ajaxLogic) {
        $scope.input = {
            url: "",
            title: {
                kor: "",
                eng: ""
            },
            thumbnail: {
                pc: "",
                mobile: ""
            }
        };
        $scope.writeFormToggle = true;
        $scope.loading = false;

        $scope.submit = function () {
            if ($scope.loading === true) {
                return;
            }
            var input = $scope.input;
            if (!urlCheck(input.url)) {
                alert("입력하신 사이트 주소가 URL형식에 맞지 않습니다.");
                return -1;
            }
            if (input.title.kor.length < 2) {
                alert("사이트명은 2글자 이상으로 적어주세요.");
                return -1;
            }
            if (input.title.eng.length < 2) {
                alert("사이트명은 2글자 이상으로 적어주세요.");
                return -1;
            }
            if (!urlCheck(input.thumbnail.pc)) {
                alert("입력하신 이미지 주소가 URL형식에 맞지 않습니다.");
                return -1;
            }

            $scope.loading = true;
            ajaxLogic.insertDocument(input, function (res) {
                switch (res.result) {
                    case "success":
                        alert("성공적으로 페이지가 등록 되었습니다.");
                        $scope.input = {
                            url: "",
                            title: {
                                kor: "",
                                eng: ""
                            },
                            thumbnail: {
                                pc: "",
                                mobile: ""
                            }
                        };
                        $scope.writeFormToggle = true;
                        break;
                    case "error":
                        if (res.errorMsg) {
                            alert(res.errorMsg);
                        }
                }
                $scope.loading = false;
            });
        }
    })
    .run(function () {

    })
    .factory("ajaxLogic", function ($http) {
        var ajaxLogic = {
            getDocuments: function (keyword, callback) {
                var keyword = this.checkFormat(keyword);
                if (keyword === -1) {
                    return -1;
                }
                $http({
                    method: 'post',
                    url: '/api/get/documents',
                    data: {
                        keyword: keyword.toLowerCase()
                    },
                    headers: { 'Content-Type': 'application/json; charset=urf-8' }
                })
                    .then(
                    function (data) {
                        var res = data.data;

                        if (typeof callback === 'function') {
                            callback(res);
                        }
                    },
                    function (data) {
                        console.warn("Ajax Error.");
                        if (typeof callback === 'function') {
                            callback(res);
                        }
                    });
            },
            insertDocument: function (input, callback) {
                $http({
                    method: 'post',
                    url: '/api/insert/document',
                    data: input,
                    headers: { 'Content-Type': 'application/json; charset=urf-8' }
                })
                    .then(
                    function (data) {
                        var res = data.data;

                        if (typeof callback === 'function') {
                            callback(res);
                        }
                    },
                    function (data) {
                        console.warn("Ajax Error.");
                        if (typeof callback === 'function') {
                            callback(res);
                        }
                    });
            },
            checkFormat: function (str) {
                if (typeof str !== 'string') {
                    return -1;
                }
                return str;
            }
        };
        return ajaxLogic;
    });


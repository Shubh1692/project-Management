angular.module('projectDev')
    .controller('addEditProjectCtrl', addEditProjectCtrl);
addEditProjectCtrl.$inject = ['$scope', 'serverRequestService', 'Upload', 'Notification', '$mdDialog', '$q', 'items'];
// Project Dev Controller
function addEditProjectCtrl($scope, serverRequestService, Upload, Notification, $mdDialog, $q, items) {
    var _THIS = this;
    $scope.project = {};
    $scope.deleteLogoFlag =true;
    $scope.minDate = new Date();
    $scope.project.startdate = $scope.minDate;
    $scope.dateChange = _dateChange;
    $scope.dynamicTheme = 'docs-dark';
    serverRequestService.serverRequest('getDeveloperList', 'GET').then(_setDeveloperDropdown);
    $scope.createEditProject = _saveProjectDetail;
    $scope.closePopup = _closePopup;
    $scope.deleteLogo = _deleteLogo;
    $scope.uploadDocs = _uploadDocs;
    $scope.getDocument = _getDocument;
    $scope.uploadLogo = _uploadLogo;
    $scope.addEditButtonFlag = false;
    $scope.editProjectDetail = _editProjectDetail;
    function _fillProjectDetail () {
        if(items) {
            $scope.addEditButtonFlag = true;
            serverRequestService.serverRequest('getProjectDetailByProjectId/'+ items, 'GET').then(_getProjectDetail);
        }
    }
    _fillProjectDetail();
    function _getProjectDetail (res) {
        $scope.project = res.result;
        $scope.project.startdateCn =  new Date(res.result.startdate);
        $scope.project.enddateCn = new Date(res.result.enddate);
        $scope.projectForm.$setUntouched();
        $scope.projectForm.$setPristine();
    }
    // Upload Logo function for click
    function _uploadLogo() {
        $scope.deleteLogoFlag = true;
        _upload($scope.project.logoImage, '/uploadLogo', 'logo').then(function(res){
            $scope.project.logoImageId = res.fileObj;
        });
    };
    // Get Doc Data
    function _getDocument (filePath){
        serverRequestService.serverRequest('files/' + filePath, 'GET').then(_getDocumentsResponse);
    }
    // function for Get Response
    function _getDocumentsResponse(res) {
        console.log(res.result);
    }
    // Upload Docs for View
    function _uploadDocs () {
        console.log($scope.project.documentArray);
        _upload($scope.project.documentArray, '/uploadDocs', 'docs').then(function(res){
           
        });
    }
    // Close Popup window
    function _closePopup(argument) {
        $mdDialog.cancel();
    }
    // Fill Developer Drop Down Data Source
    function _setDeveloperDropdown(res) {
        $scope.developerDataSource = res.result;
    }
    // _dateChange Function
    function _dateChange(argument) {
       $scope.minDate = $scope.project.startdate;
    }
    // upload on file select or drop 
    function _upload(file, url, fieldType) {
        var defer = $q.defer();
        if (file) {
            var data = {};
            data.url = url;
            data.data = {};
            data.data[fieldType] = file;
            data.header = {
                'Content-Type': undefined
            };
            $scope.submitDisable = true;
            Upload.upload(data).then(function(res) {
                $scope.submitDisable = false;
                defer.resolve({
                    fileObj: {
                        docPath: res.data.result.absolutePath,
                        docName: res.data.result.filename,
                        originalname : res.data.result.originalname
                    }
                });
            }, function(res) {
                $scope.submitDisable = false;
                serverRequestService.serverError(res);
                defer.resolve({
                    fileObj: null
                });
            }, function(evt) {
                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                console.log('progress: ', progressPercentage, '% ', evt.config.data.logo);
            });
        }
        return defer.promise;
    };

    // Delete Logo Button at view
    function _deleteLogo() {
        if ($scope.project.logoImageId.docName) {
            $scope.deleteLogoFlag = false;
            _deleteDocument($scope.project.logoImageId.docName, $scope.project.logoImageId._id).then(function(){
                $scope.project.logoImageId = null;
                $scope.deleteLogoFlag = true;
            });
        }
    }
    // Delete Selected Doc
    function _deleteDocument(selectedName, id) {
        var defer = $q.defer();
        var url = 'deleteDocument?name=' + selectedName + '&id=' + id;
        var deleteDocumentReq = serverRequestService.serverRequest(url, 'GET').then(function(res) {
            defer.resolve(res);
        },function(res){
            defer.reject(res);
        });
        return defer.promise;
    }
    // local function for show notification
    function _showNotification(type, message, title, delay) {
        Notification[type]({
            message: message,
            title: title,
            delay: delay
        });
    }
    // Save Project Detail in DB
    function _saveProjectDetail() {
        if ($scope.projectForm.$valid) {
            $scope.project.startdate = $scope.project.startdateCn;
            $scope.project.enddate = $scope.project.enddateCn;
            serverRequestService.serverRequest('createNewProject', 'POST', $scope.project).then(function(res) {
                _showNotification('success', 'Porject Save successfully', 'Save', 2000);
                $mdDialog.cancel();
            },function(res){
                angular.forEach(res.result.errors, function(value){
                    _showNotification('error',value.message, value.path, 4000);
                });
            });
        } else {
            $scope.projectForm.$setSubmitted();
        }
    }

    // Edit Project Detail in DB 
    function  _editProjectDetail() {
        var uploadObj = {};
        if ($scope.projectForm.$valid) {
            $scope.project.startdate = $scope.project.startdateCn;
            $scope.project.enddate = $scope.project.enddateCn;
            $scope.project.logoImageIdNew = angular.copy($scope.project.logoImageId);
            $scope.project.logoImageId = undefined;
            serverRequestService.serverRequest('editProjectDetail/' + items, 'PUT', $scope.project).then(function(res) {
                _showNotification('success', 'Porject Update successfully', 'Update', 2000);
                $mdDialog.cancel();
            },function(res){
                angular.forEach(res.result.errors, function(value){
                    _showNotification('error',value.message, value.path, 4000);
                });
            });
        } else {
            $scope.projectForm.$setSubmitted();
        }
    }
}
sap.ui.define([
	"com/infocus/app/fi/zTaxApprove/controller/BaseController",
	"sap/ui/core/Fragment",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"com/infocus/app/fi/zTaxApprove/model/formatter"
], function(BaseController, Fragment, MessageBox, MessageToast, Filter,formatter) {
	"use strict";

	return BaseController.extend("com.infocus.app.fi.zTaxApprove.controller.tax.OtherSource", {
	    formatter: formatter,

		onInit: function() {
			//var oRouter = this.getRouter();

			//	oRouter.getRoute("employee").attachMatched(this._onRouteMatched, this);
			this.getOwnerComponent().getEventBus().subscribe("Default", "getOtherSourcData", () => {
				this._onOtherSourceDataSet();
			});
			//this._onOtherSourceDataSet();
			this._initialDisplay();
		},
		downloadSupportingDoc: function(oEvent) {
			var that = this;
			var oButton = oEvent.getSource();
			var buttonValue = oButton.data("value");
			var oOtherSourcesData = this.getView().getModel("OtherSources").getData();
			oOtherSourcesData.buttonValue = buttonValue;
			this.getView().getModel("OtherSources").setData(oOtherSourcesData);
			/*var btn80c = this.getView().byId("btn80c");*/

			// fragment open 
			if (!this._oValueOnFileView) {
				this._oValueOnFileView = sap.ui.xmlfragment("com.infocus.app.fi.zTaxApprove.view.tax.fragment.FileUploadOtherSourceView", this);
				this._oValueOnFileView.setModel(that.getOwnerComponent().getModel("FileUploadOtherSourceView"));
				this.getView().addDependent(this._oValueOnFileView);

			}
			this._oValueOnFileView.open();

			// get the list of file from server 
			var oModel = that.getOwnerComponent().getModel();
			var oItemModel = that.getOwnerComponent().getModel("itemsData");
			var oItemData = oItemModel.getData();
			
			var oJsonGlobalData = this.getOwnerComponent().getModel("globalData").getData();
			var oPernerFilter = new sap.ui.model.Filter("Pernr", sap.ui.model.FilterOperator.EQ, oJsonGlobalData.selectedPernr);
			var oDescFilter = new sap.ui.model.Filter("Zdesc", sap.ui.model.FilterOperator.EQ,oOtherSourcesData.buttonValue);
			/*var oFiscalYearFilter = new sap.ui.model.Filter("fiscal", sap.ui.model.FilterOperator.EQ, oJsonGlobalData.selectedYear);*/
			sap.ui.core.BusyIndicator.show();
			oModel.read("/ZfileSet", {

				filters: [oPernerFilter, oDescFilter],
				//In the case of success, the existing documents are in oData.results
				success: function(response) {
					var oData = response.results;

					oItemModel.setData(oData);
					console.log(oItemModel);
					sap.ui.core.BusyIndicator.hide();

				},
				error: function(error) {
					console.log(error);
					sap.ui.core.BusyIndicator.hide();
				}

			});

		},
		onCancelPressView: function(oEvent) {
			this._oValueOnFileView.close();

		},
		onDownloadFile: function(oEvent) {
			var fileIndex = Number(oEvent.mParameters.id.split("-")[2]);
			var oUploadedFile = sap.ui.getCore().byId("UploadCollectionOtherSourceView");
			var aSelectedItems = oUploadedFile.getItems();
			if (aSelectedItems) {

				oUploadedFile.downloadItem(aSelectedItems[fileIndex], true);
			} else {
				MessageToast.show("Select an item to download");
			}
		},
		_onRouteMatched: function(oEvent) {
			var oArgs, oView;
			oArgs = oEvent.getParameter("arguments");
			oView = this.getView();

			oView.bindElement({
				path: "/Employees(" + oArgs.employeeId + ")",
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function(oEvent) {
						oView.setBusy(true);
					},
					dataReceived: function(oEvent) {
						oView.setBusy(false);
					}
				}
			});
		},
		_initialDisplay: function() {
			this.byId("editItemId").setVisible(false);
			this.byId("displayItemId").setVisible(true);
		},
		handleEditPress: function() {
			this._toggleButtonsAndView(true);
		},
		handleCancelPress: function() {
			this._toggleButtonsAndView(false);
		},
		handleSavePress: function() {
			this.onSave();
			this._toggleButtonsAndView(false);
		},
		_toggleButtonsAndView: function(bEdit) {
			var oView = this.getView();
			oView.byId("edit").setVisible(!bEdit);
			oView.byId("save").setVisible(bEdit);
			oView.byId("cancel").setVisible(bEdit);
			this.byId("editItemId").setVisible(bEdit);
			this.byId("displayItemId").setVisible(!bEdit);
		},
		_onOtherSourceDataSet: function() {
			var that = this;
			var oJsonGlobalData = this.getOwnerComponent().getModel("globalData").getData();
			var oModel = this.getOwnerComponent().getModel();
			//var oPernerFilter = new sap.ui.model.Filter("personnelNo", sap.ui.model.FilterOperator.EQ, "1000");
			var oFiscalYearFilter = new sap.ui.model.Filter("fiscalYear", sap.ui.model.FilterOperator.EQ, oJsonGlobalData.selectedYear);
			//var oFiscalYearFilter = new Filter("fiscalYear", sap.ui.model.FilterOperator.EQ, "2022-2023");
			var oUrl = "/TaxOtherSources";

			oModel.read(oUrl, {
				filters: [oFiscalYearFilter],
				success: function(response) {
					//oJsonGlobalData.oTotal80CDeclaredAmount = 0;
					var data = response.results;
					var oJsonSec80cModel = that.getOwnerComponent().getModel('OtherSources');
					oJsonSec80cModel.setData(data);
				},
				error: function(error) {
					//console.log(error);
					MessageToast.show("Error in loading the Financial Years" + error);
				}
			});
			oModel.attachRequestCompleted(function() {
				var headerModel = this.getOwnerComponent().getModel('employeeData').getData();
				if (headerModel[0] !== undefined && headerModel[0].projection === 'X') {
					this.byId('edit').setEnabled(true);
					this.byId('edit').setVisible(true);
				} else {
					this.byId('edit').setEnabled(false);
					this.byId('edit').setVisible(false);
					this.byId('save').setVisible(false);
					this.byId('cancel').setVisible(false);
				}
				
				this.byId("editItemId").setVisible(false);
				this.byId("displayItemId").setVisible(true);
			}.bind(this));
		},
		onChange: function(oEvent) {
			// input field validation
			var dataValid = parseInt(oEvent.getSource().getValue());

			if (dataValid < 0) {
				MessageToast.show("input field can't hold negative value: " + dataValid);
				return oEvent.getSource().setValue("");
			}

			var oData = this.getOwnerComponent().getModel('sec80c').getData();
			var oJsonGlobalData = this.getOwnerComponent().getModel("globalData").getData();
			//oJsonGlobalData.oTotal80CDeclaredAmount = 0;
			for (var i = 0; i < oData.length; i++) {
				oJsonGlobalData.oTotal80DeclaredAmount += Number(oData[i].Acopc);
			}
			
			// dataValidInt variable
			oJsonGlobalData.dataValidInt = dataValid;
			this.getOwnerComponent().getModel("globalData").setData(oJsonGlobalData);
		},

		onSave: function() {
			var dataArray = this.getOwnerComponent().getModel("OtherSources").getData();
			for (var i = 0; i < dataArray.length; i++) {
				delete dataArray[i].__metadata;
			}

			var oJsonGlobalData = this.getOwnerComponent().getModel("globalData").getData();
			if (oJsonGlobalData.dataValidInt < 0) {
				MessageBox.information("Input Amount can't be negative");
			} else if (oJsonGlobalData.dataValidInt === 0) {
				MessageBox.information("Input Amount can't be zero");
			} else {
				this._onSavOtherSourceDataSet(dataArray);
			}
			
		},

		_onSavOtherSourceDataSet: function(oData) {
			var oModel = this.getOwnerComponent().getModel();
			var oUrl = "/TaxOtherSources";
			oModel.create(oUrl, oData[0], {
					success: function(response) {
						MessageBox.information("The Other Sources data is saved");
					},
					error: function(error) {
						MessageBox.information("The Other Sources data is not saved");
					}
				}

			);
		},

	});

});
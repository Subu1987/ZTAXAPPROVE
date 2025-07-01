sap.ui.define([
	"com/infocus/app/fi/zTaxApprove/controller/BaseController",
	"sap/ui/core/Fragment",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"com/infocus/app/fi/zTaxApprove/model/formatter"
], function(BaseController, Fragment, MessageBox, MessageToast, Filter,formatter) {
	"use strict";

	return BaseController.extend("com.infocus.app.fi.zTaxApprove.controller.tax.TaxOnProperty", {
	    formatter: formatter,

		onInit: function() {
			//var oRouter = this.getRouter();

			//	oRouter.getRoute("employee").attachMatched(this._onRouteMatched, this);
			//this._onReadHousePropertyDataSet();
			this._initialDisplay();
			this.getOwnerComponent().getEventBus().subscribe("Default", "getHousePropertyData", () => {
				this._onReadHousePropertyDataSet();
			});
		},
		downloadSupportingDoc: function(oEvent) {
			var that = this;
			var oButton = oEvent.getSource();
			var buttonValue = oButton.data("value");
			var oHousePropertyData = this.getView().getModel("HouseProperty").getData();
			oHousePropertyData.buttonValue = buttonValue;
			this.getView().getModel("HouseProperty").setData(oHousePropertyData);
			/*var btn80c = this.getView().byId("btn80c");*/

			// fragment open 
			if (!this._oValueOnFileView) {
				this._oValueOnFileView = sap.ui.xmlfragment("com.infocus.app.fi.zTaxApprove.view.tax.fragment.FileUploadHousePropertyView", this);
				this._oValueOnFileView.setModel(that.getOwnerComponent().getModel("FileUploadHousePropertyView"));
				this.getView().addDependent(this._oValueOnFileView);

			}
			this._oValueOnFileView.open();

			// get the list of file from server 
			var oModel = that.getOwnerComponent().getModel();
			var oItemModel = that.getOwnerComponent().getModel("itemsData");
			var oItemData = oItemModel.getData();
			
			var oJsonGlobalData = this.getOwnerComponent().getModel("globalData").getData();
			var oPernerFilter = new sap.ui.model.Filter("Pernr", sap.ui.model.FilterOperator.EQ, oJsonGlobalData.selectedPernr);
			var oDescFilter = new sap.ui.model.Filter("Zdesc", sap.ui.model.FilterOperator.EQ, oHousePropertyData.buttonValue);
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
			var oUploadedFile = sap.ui.getCore().byId("UploadCollectionHousePropertyView");
			var aSelectedItems = oUploadedFile.getItems();
			if (aSelectedItems) {

				oUploadedFile.downloadItem(aSelectedItems[fileIndex], true);
			} else {
				MessageToast.show("Select an item to download");
			}
		},
		handleLendersTypeValueHelp: function() {
			var that = this;
			if (!this._oValueHelpLenderTypeDialog) {
				this._oValueHelpLenderTypeDialog = sap.ui.xmlfragment("com.infocus.app.fi.zTaxApprove.view.fragment.LendersType", this);
				//this._oValueHelpAccDialog.setModel(that.getOwnerComponent().getModel("AccType"));
				this.getView().addDependent(this._oValueHelpLenderTypeDialog);
			}
			this._oValueHelpLenderTypeDialog.open();
		},

		handleLendersTypeValueHelpClose: function(oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem"),
				oInput = this.byId("lenderTypeInput");

			if (oSelectedItem) {
				var oValue = oSelectedItem.getTitle() + " " + oSelectedItem.getDescription();
				this.byId("lenderTypeInput").setValue(oValue);
				var oLendersTypeData = this.getOwnerComponent().getModel('HouseProperty').getData();
				oLendersTypeData[0].lendersType = oSelectedItem.getTitle();
				this.getOwnerComponent().getModel('HouseProperty').setData(oLendersTypeData);
			}

			if (!oSelectedItem) {
				oInput.resetProperty("");
			}
		},
		onDialogLendersTypeClose: function(oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				var year = aContexts.map(function(oContext) {
					return oContext.getObject().Title;
				}).join(", ");
				MessageToast.show("You have chosen " + year);

			} else {
				MessageToast.show("No new item was selected.");
			}
			oEvent.getSource().getBinding("items").filter([]);
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
		_onReadHousePropertyDataSet: function() {
			var that = this;
			var oJsonGlobalData = this.getOwnerComponent().getModel("globalData").getData();
			var oModel = this.getOwnerComponent().getModel();
			//var oPernerFilter = new Filter("personnelNo", sap.ui.model.FilterOperator.EQ, oJsonGlobalData.userId);
			//var oPernerFilter = new sap.ui.model.Filter("personnelNo", sap.ui.model.FilterOperator.EQ, "1000");
			var oFiscalYearFilter = new sap.ui.model.Filter("fiscalYear", sap.ui.model.FilterOperator.EQ, oJsonGlobalData.selectedYear);
			//var oFiscalYearFilter = new Filter("fiscalYear", sap.ui.model.FilterOperator.EQ, "2022-2023");
			var oUrl = "/TaxHouseProperty";

			oModel.read(oUrl, {
				filters: [oFiscalYearFilter],
				success: function(response) {
					oJsonGlobalData.oTotal80CDeclaredAmount = 0;
					var data = response.results;
					var oJsonSec80cModel = that.getOwnerComponent().getModel('HouseProperty');
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
            
            var oJsonGlobalData = this.getOwnerComponent().getModel("globalData").getData();
            
            
			// dataValidInt variable
			oJsonGlobalData.dataValidInt = dataValid;
			this.getOwnerComponent().getModel("globalData").setData(oJsonGlobalData);
		},

		onSave: function() {
			var dataArray = this.getOwnerComponent().getModel("HouseProperty").getData();
			for (var i = 0; i < dataArray.length; i++) {
				delete dataArray[i].__metadata;
			}
			this._onSaveHousePropertyDataSet(dataArray);
		},

		_onSaveHousePropertyDataSet: function(oData) {
			var oModel = this.getOwnerComponent().getModel();
			var oUrl = "/TaxHouseProperty";
			//var oPernerFilter = new sap.ui.model.Filter("Pernr", sap.ui.model.FilterOperator.EQ, '1000');
			//var oFiscalYearFilter = new sap.ui.model.Filter("Fiscal", sap.ui.model.FilterOperator.EQ, '2022-2023');
			oModel.create(oUrl, oData[0], {
					success: function(response) {
						MessageBox.information("Income from Property data is saved");
					},
					error: function(error) {
						MessageBox.information("Income from Property data is not saved");
					}
				}

			);
		}

	});

});
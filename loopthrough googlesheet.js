function main() {
  // 1) Open the sheet
  var ss = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/1Qtxt6LXixvS8_t4IgVW-x5DI_v3thy3ulbe6wV8nFSg/edit?gid=0#gid=0");
  var sheet = ss.getSheetByName("Sheet1");    // whatever you named it
  var rows = sheet.getDataRange().getValues();  

  // 2) Build the same `data` object dynamically
  var data = {};
  for (var i = 1; i < rows.length; i++) {   // start at 1 to skip header
    var row = rows[i];
    var campaignName   = row[0];
    var adGroupName    = row[1];
    var cpcBid         = parseFloat(row[2]);
    var finalUrl       = row[3];
    var headlinesArr   = row[4].toString().split("|");
    var descArr        = row[5].toString().split("|");
    var keywordsArr    = row[6].toString().split("|");
    
    if (!data[campaignName]) {
      data[campaignName] = [];
    }
    data[campaignName].push({
      adGroupName: adGroupName,
      cpcBid:      cpcBid,
      finalUrl:    finalUrl,
      headlines:   headlinesArr,
      descriptions:descArr,
      keywords:    keywordsArr
    });
  }
  
  // 3) Your existing loop, now driven by spreadsheet
  for (var campaignName in data) {
    var campaignIterator = AdsApp.campaigns()
        .withCondition('Name = "' + campaignName + '"')
        .get();
    if (!campaignIterator.hasNext()) {
      Logger.log('Campaign "' + campaignName + '" not found.');
      continue;
    }
    var campaign = campaignIterator.next();
    
    data[campaignName].forEach(function(adGroupData) {
      var adGroupOp = campaign.newAdGroupBuilder()
        .withName(adGroupData.adGroupName)
        .withCpc(adGroupData.cpcBid)
        .build();
      if (!adGroupOp.isSuccessful()) {
        Logger.log("Failed to create ad group: " + adGroupData.adGroupName);
        return;
      }
      var adGroup = adGroupOp.getResult();
      
      // Responsive Search Ad
      var adOp = adGroup.newAd().responsiveSearchAdBuilder()
        .withFinalUrl(adGroupData.finalUrl)
        .withHeadlines(adGroupData.headlines)
        .withDescriptions(adGroupData.descriptions)
        .build();
      if (adOp.isSuccessful()) {
        Logger.log("Ad created for " + adGroup.getName());
      }
      
      // Keywords
      adGroupData.keywords.forEach(function(k) {
        adGroup.newKeywordBuilder()
          .withText(k)
          .withCpc(adGroupData.cpcBid)
          .build();
      });
    });
  }
}

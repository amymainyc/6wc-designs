// PSD Batch Processor - Adobe Photoshop Script
// This script processes a CSV file and creates customized PSD files
// Place this file in your Photoshop Scripts folder or run directly from ExtendScript Toolkit

// Configuration settings (embedded for simplicity)
var Config = {
    // ==== FILE PATHS ====
    TEMPLATE_PSD_PATH: "C:/Users/amyma/Documents/PhotoShop/6WC/supporter_banner_template.psd",
    DATA_FILE: "C:/Users/amyma/Documents/Coding/random/osugfx/psd-editor/data.csv",
    OUTPUT_FOLDER: "C:/Users/amyma/Documents/Coding/random/osugfx/psd-editor/output",
    
    // ==== ASSET PATHS ====
    PROFILES_FOLDER: "C:/Users/amyma/Documents/PhotoShop/6WC/assets",
    FLAGS_FOLDER: "C:/Users/amyma/Documents/PhotoShop/6WC/assets/flags",
    
    // ==== LAYER NAMES ====
    PROFILE_GROUP_NAME: "PROFILE",
    TITLE_GROUP_NAME: "TITLE",
    PROFILE_IMAGE_KEYWORD: "PFP!",
    PROFILE_TEXT_KEYWORD: "NAME!",
    COUNTRY_TEXT_KEYWORD: "TEAM!",
    FLAG_IMAGE_KEYWORD: "FLAG!",
    
    // ==== TEXT FORMATTING ====
    COUNTRY_TEXT_TEMPLATE: "TEAM {country}",
    COUNTRY_TEXT_UPPERCASE: true,
    
    // ==== HELPER FUNCTIONS ====
    getProfilePath: function(name) {
        return this.PROFILES_FOLDER + "/" + name + ".png";
    },
    
    getFlagPath: function(country) {
        return this.FLAGS_FOLDER + "/" + country.toLowerCase() + ".svg";
    },
    
    getOutputPath: function(filename) {
        return this.OUTPUT_FOLDER + "/" + filename;
    },
    
    formatCountryText: function(country) {
        var text = this.COUNTRY_TEXT_TEMPLATE.replace("{country}", country);
        return this.COUNTRY_TEXT_UPPERCASE ? text.toUpperCase() : text;
    }
};

// Main processing function
function processPSDFiles() {
    try {
        // Read and parse CSV data
        var csvData = readCSVFile(Config.DATA_FILE);
        if (!csvData || csvData.length === 0) {
            alert("No data found in CSV file: " + Config.DATA_FILE);
            return;
        }
        
        // Create output directory if it doesn't exist
        var outputFolder = new Folder(Config.OUTPUT_FOLDER);
        if (!outputFolder.exists) {
            outputFolder.create();
        }
        
        // Process each entry in the CSV
        for (var i = 0; i < csvData.length; i++) {
            var entry = csvData[i];
            try {
                processEntry(entry.name, entry.country, i + 1, csvData.length);
            } catch (e) {
                alert("Error processing entry " + entry.name + ": " + e.message);
                continue;
            }
        }
        
        alert("Processing complete! Generated " + csvData.length + " PSD files.");
        
    } catch (error) {
        alert("Script error: " + error.message);
    }
}

// Process a single entry (name, country pair)
function processEntry(name, country, currentIndex, totalCount) {
    // Show progress
    var progressMessage = "Processing " + currentIndex + " of " + totalCount + ": " + name + " (" + country + ")";
    
    // Open the template PSD
    var templateFile = new File(Config.TEMPLATE_PSD_PATH);
    if (!templateFile.exists) {
        throw new Error("Template PSD file not found: " + Config.TEMPLATE_PSD_PATH);
    }
    
    var doc = app.open(templateFile);
    
    try {
        // Update profile picture
        updateProfilePicture(doc, name);
        
        // Update profile name text
        updateProfileText(doc, name);
        
        // Update country text
        updateCountryText(doc, country);
        
        // Update flag image
        updateFlagImage(doc, country);
        
        // Save the modified PSD
        var outputFileName = "supporter_banner_" + name + ".psd";
        var outputFile = new File(Config.getOutputPath(outputFileName));
        
        // Save as PSD
        var psdOptions = new PhotoshopSaveOptions();
        psdOptions.embedColorProfile = true;
        psdOptions.alphaChannels = true;
        psdOptions.layers = true;
        
        doc.saveAs(outputFile, psdOptions);
        
    } finally {
        // Close the document
        doc.close(SaveOptions.DONOTSAVECHANGES);
    }
}

// Update profile picture in the PROFILE group
function updateProfilePicture(doc, name) {
    var profilePath = Config.getProfilePath(name);
    var profileFile = new File(profilePath);
    
    if (!profileFile.exists) {
        throw new Error("Profile image not found: " + profilePath);
    }
    
    // Find the profile image layer
    var profileLayer = findLayerByKeyword(doc, Config.PROFILE_IMAGE_KEYWORD, Config.PROFILE_GROUP_NAME);
    if (!profileLayer) {
        throw new Error("Profile image layer not found (looking for: " + Config.PROFILE_IMAGE_KEYWORD + ")");
    }
    
    // Replace the image
    replaceSmartObject(profileLayer, profileFile);
}

// Update profile name text in the PROFILE group
function updateProfileText(doc, name) {
    var textLayer = findLayerByKeyword(doc, Config.PROFILE_TEXT_KEYWORD, Config.PROFILE_GROUP_NAME);
    if (!textLayer) {
        throw new Error("Profile text layer not found (looking for: " + Config.PROFILE_TEXT_KEYWORD + ")");
    }
    
    if (textLayer.kind !== LayerKind.TEXT) {
        throw new Error("Found layer is not a text layer: " + textLayer.name);
    }
    
    textLayer.textItem.contents = name;
}

// Update country text in the TITLE group
function updateCountryText(doc, country) {
    var textLayer = findLayerByKeyword(doc, Config.COUNTRY_TEXT_KEYWORD, Config.TITLE_GROUP_NAME);
    if (!textLayer) {
        throw new Error("Country text layer not found (looking for: " + Config.COUNTRY_TEXT_KEYWORD + ")");
    }
    
    if (textLayer.kind !== LayerKind.TEXT) {
        throw new Error("Found layer is not a text layer: " + textLayer.name);
    }
    
    textLayer.textItem.contents = Config.formatCountryText(country);
}

// Update flag image
function updateFlagImage(doc, country) {
    var flagPath = Config.getFlagPath(country);
    var flagFile = new File(flagPath);
    
    if (!flagFile.exists) {
        throw new Error("Flag image not found: " + flagPath);
    }
    
    // Find the flag image layer
    var flagLayer = findLayerByKeyword(doc, Config.FLAG_IMAGE_KEYWORD);
    if (!flagLayer) {
        throw new Error("Flag image layer not found (looking for: " + Config.FLAG_IMAGE_KEYWORD + ")");
    }
    
    // Replace the image
    replaceSmartObject(flagLayer, flagFile);
}

// Find a layer by keyword in its name, optionally within a specific group
function findLayerByKeyword(doc, keyword, groupName) {
    if (groupName) {
        // First find the group
        var group = findLayerByName(doc, groupName);
        if (!group) {
            throw new Error("Group not found: " + groupName);
        }
        return findLayerInGroup(group, keyword);
    } else {
        return findLayerInContainer(doc, keyword);
    }
}

// Find a layer by exact name
function findLayerByName(container, name) {
    for (var i = 0; i < container.layers.length; i++) {
        if (container.layers[i].name === name) {
            return container.layers[i];
        }
        // Check nested groups
        if (container.layers[i].typename === "LayerSet") {
            var found = findLayerByName(container.layers[i], name);
            if (found) return found;
        }
    }
    return null;
}

// Find a layer containing a keyword in a group
function findLayerInGroup(group, keyword) {
    for (var i = 0; i < group.layers.length; i++) {
        if (group.layers[i].name.indexOf(keyword) !== -1) {
            return group.layers[i];
        }
        // Check nested groups
        if (group.layers[i].typename === "LayerSet") {
            var found = findLayerInGroup(group.layers[i], keyword);
            if (found) return found;
        }
    }
    return null;
}

// Find a layer containing a keyword in any container
function findLayerInContainer(container, keyword) {
    for (var i = 0; i < container.layers.length; i++) {
        if (container.layers[i].name.indexOf(keyword) !== -1) {
            return container.layers[i];
        }
        // Check nested groups
        if (container.layers[i].typename === "LayerSet") {
            var found = findLayerInContainer(container.layers[i], keyword);
            if (found) return found;
        }
    }
    return null;
}

// Replace content of a Smart Object layer
function replaceSmartObject(layer, newFile) {
    // Select the layer
    app.activeDocument.activeLayer = layer;
    
    // Check if it's a smart object
    try {
        // Try to replace smart object contents
        var idplacedLayerReplaceContents = stringIDToTypeID("placedLayerReplaceContents");
        var desc = new ActionDescriptor();
        desc.putPath(charIDToTypeID("null"), newFile);
        executeAction(idplacedLayerReplaceContents, desc, DialogModes.NO);
    } catch (e) {
        // If not a smart object, try to place the image directly
        try {
            placeFile(newFile);
        } catch (e2) {
            throw new Error("Could not replace image in layer: " + layer.name + " - " + e2.message);
        }
    }
}

// Place a file (for non-smart object layers)
function placeFile(file) {
    var idPlc = charIDToTypeID("Plc ");
    var desc = new ActionDescriptor();
    desc.putPath(charIDToTypeID("null"), file);
    desc.putEnumerated(charIDToTypeID("FTcs"), charIDToTypeID("QCSt"), charIDToTypeID("Qcsa"));
    var idOfst = charIDToTypeID("Ofst");
    var desc2 = new ActionDescriptor();
    desc2.putUnitDouble(charIDToTypeID("Hrzn"), charIDToTypeID("#Rlt"), 0.000000);
    desc2.putUnitDouble(charIDToTypeID("Vrtc"), charIDToTypeID("#Rlt"), 0.000000);
    desc.putObject(idOfst, idOfst, desc2);
    executeAction(idPlc, desc, DialogModes.NO);
}

// Helper function to trim whitespace (ExtendScript doesn't have native trim)
function trimString(str) {
    return str.replace(/^\s+|\s+$/g, '');
}

// Read and parse CSV file
function readCSVFile(filePath) {
    var file = new File(filePath);
    if (!file.exists) {
        throw new Error("CSV file not found: " + filePath);
    }
    
    file.open("r");
    var content = file.read();
    file.close();
    
    var lines = content.split("\n");
    var data = [];
    
    // Skip header row and process data
    for (var i = 1; i < lines.length; i++) {
        var line = trimString(lines[i]);
        if (line.length === 0) continue;
        
        var parts = line.split(",");
        if (parts.length >= 2) {
            data.push({
                name: trimString(parts[0]),
                country: trimString(parts[1])
            });
        }
    }
    
    return data;
}

// Run the main function
processPSDFiles();

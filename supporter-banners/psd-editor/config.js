// Configuration settings for PSD Batch Processor
// Modify these paths and settings according to your setup

var Config = {
    // ==== FILE PATHS ====
    
    // Template PSD file (the example file you'll use as base)
    TEMPLATE_PSD_PATH: "C:/Users/amyma/Documents/PhotoShop/6WC/supporter_banner_template.psd",
    
    // Data file containing names and countries (CSV)
    DATA_FILE: "data.csv",
    
    // Output folder for generated PSD files
    OUTPUT_FOLDER: "output",
    
    // ==== ASSET PATHS ====
    
    // Folder containing profile pictures (should be named as <name>.png)
    PROFILES_FOLDER: "C:/Users/amyma/Documents/PhotoShop/6WC/assets",
    
    // Folder containing flag images (should be named as <country>.svg)
    FLAGS_FOLDER: "C:/Users/amyma/Documents/PhotoShop/6WC/assets/flags",
    
    // ==== LAYER NAMES ====
    // These should match the layer names in your PSD file
    
    PROFILE_GROUP_NAME: "PROFILE",
    TITLE_GROUP_NAME: "TITLE",
    
    // Specific layer names to look for (adjust based on your PSD structure)
    PROFILE_IMAGE_KEYWORD: "PFP!",
    PROFILE_TEXT_KEYWORD: "NAME!",
    COUNTRY_TEXT_KEYWORD: "TEAM!",
    FLAG_IMAGE_KEYWORD: "FLAG!",
    
    // ==== TEXT FORMATTING ====
    
    // Template for country text (use {country} as placeholder)
    COUNTRY_TEXT_TEMPLATE: "TEAM {country}",
    
    // Whether to convert country names to uppercase
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

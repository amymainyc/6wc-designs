// After Effects ExtendScript to generate staff banners from data.csv
// Run this script from After Effects: File > Scripts > Run Script File

(function() {
    // Create ScriptUI window for output
    var win = new Window("palette", "Banner Generator", undefined);
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 10;
    win.margins = 16;
    
    var outputGroup = win.add("group");
    outputGroup.orientation = "column";
    outputGroup.alignChildren = ["fill", "fill"];
    outputGroup.spacing = 5;
    
    win.add("statictext", undefined, "Output Log:");
    var outputText = win.add("edittext", undefined, "", {multiline: true, scrolling: true});
    outputText.preferredSize = [600, 400];
    
    var buttonGroup = win.add("group");
    buttonGroup.orientation = "row";
    buttonGroup.alignment = "center";
    
    var closeBtn = buttonGroup.add("button", undefined, "Close");
    closeBtn.onClick = function() {
        win.close();
    };
    
    // Custom logging function
    function log(message) {
        outputText.text += message + "\n";
        $.writeln(message);
    }
    
    win.show();
    
    // Configuration
    var projectFolder = new Folder($.fileName).parent;
    // var projectFoldeerName = projectFolder.fsName + "/../../../../../../Documents/PhotoShop/6WC/staff-banners";
    var templateFile = new File(projectFolder.fsName + "/6wc banner purple.aep");
    var csvFile = new File(projectFolder.fsName + "/data.csv");
    var assetsFolder = projectFolder.fsName + "/../assets/";
    var outputFolder = new Folder(projectFolder.fsName + "/output");
    var logFile = new File(projectFolder.fsName + "/processing_results.txt");
    
    // Global array to track processing results
    var processingResults = [];
    
    // Get reference dimensions from munamu.png
    var referenceWidth = null;
    var referenceHeight = null;
    var munamuFile = new File(assetsFolder + "munamu.png");
    if (munamuFile.exists) {
        try {
            var tempImport = new ImportOptions(munamuFile);
            var tempFootage = app.project.importFile(tempImport);
            referenceWidth = tempFootage.width;
            referenceHeight = tempFootage.height;
            tempFootage.remove();
            log("Reference dimensions from munamu.png: " + referenceWidth + "x" + referenceHeight);
        } catch (e) {
            log("Warning: Could not read munamu.png dimensions: " + e.toString());
        }
    } else {
        log("Warning: munamu.png not found, cannot match dimensions");
    }
    
    // Create output folder if it doesn't exist
    if (!outputFolder.exists) {
        outputFolder.create();
    }
    
    // Trim function for ExtendScript (doesn't have native trim)
    function trim(str) {
        return str.replace(/^\s+|\s+$/g, '');
    }
    
    // Parse CSV file
    function parseCSV(file) {
        var data = [];
        file.open("r");
        var content = file.read();
        file.close();
        
        var lines = content.split(/\r?\n/);
        var headers = lines[0].split(",");
        
        for (var i = 1; i < lines.length; i++) {
            if (trim(lines[i]) === "") continue;
            
            // Handle CSV parsing with commas in fields
            var row = parseCSVLine(lines[i]);
            var obj = {};
            for (var j = 0; j < headers.length; j++) {
                obj[trim(headers[j])] = row[j] ? trim(row[j]) : "";
            }
            data.push(obj);
        }
        return data;
    }
    
    // Parse a single CSV line handling quoted fields
    function parseCSVLine(line) {
        var result = [];
        var current = "";
        var inQuotes = false;
        
        for (var i = 0; i < line.length; i++) {
            var ch = line.charAt(i);
            
            if (ch === '"') {
                inQuotes = !inQuotes;
            } else if (ch === ',' && !inQuotes) {
                result.push(current);
                current = "";
            } else {
                current += ch;
            }
        }
        result.push(current);
        return result;
    }
    
    // Format role text according to requirements
    // Returns object with separate roleText and mapText for two text layers
    // Format: ROLE 1    / map1a
    //         ROLE 1    / map1b
    //         ROLE 2    / map2
    function formatRoleText(role1, role2, maps1, maps2) {
        var roleText = "";
        var mapText = "";
        
        if (role1) {
            var role1Upper = role1.toUpperCase();
            
            if (maps1) {
                // Split by & and create a line for each map
                var mapsList = maps1.split(" & ");
                for (var i = 0; i < mapsList.length; i++) {
                    if (roleText !== "") {
                        roleText += "\n";
                        mapText += "\n";
                    }
                    roleText += role1Upper;
                    mapText += "/ " + trim(mapsList[i]);
                }
            } else {
                // Role with no maps
                if (roleText !== "") {
                    roleText += "\n";
                    mapText += "\n";
                }
                roleText += role1Upper;
                mapText += "";
            }
        }
        
        if (role2) {
            var role2Upper = role2.toUpperCase();
            
            if (maps2) {
                // Split by & and create a line for each map
                var mapsList = maps2.split(" & ");
                for (var i = 0; i < mapsList.length; i++) {
                    if (roleText !== "") {
                        roleText += "\n";
                        mapText += "\n";
                    }
                    roleText += role2Upper;
                    mapText += "/ " + trim(mapsList[i]);
                }
            } else {
                // Role with no maps
                if (roleText !== "") {
                    roleText += "\n";
                    mapText += "\n";
                }
                roleText += role2Upper;
                mapText += "";
            }
        }
        
        return {roleText: roleText, mapText: mapText};
    }
    
    // Process a single entry
    function processEntry(entry) {
        var username = entry.username;
        var role1 = entry.role1 || "";
        var role2 = entry.role2 || "";
        var maps1 = entry.maps1 || "";
        var maps2 = entry.maps2 || "";
        
        log("Processing: " + username);
        
        // Open the template project
        var templateProject = app.open(templateFile);
        
        if (!templateProject) {
            throw new Error("Could not open template file!");
        }
        
        // Find the "player icon" composition
        var playerIconComp = null;
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem && item.name.toLowerCase() === "player icon") {
                playerIconComp = item;
                break;
            }
        }
        
        if (!playerIconComp) {
            app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
            throw new Error("Could not find 'player icon' composition!");
        }
        
        // Debug: List all layers
        log("  Found " + playerIconComp.numLayers + " layers in composition:");
        for (var i = 1; i <= playerIconComp.numLayers; i++) {
            var layer = playerIconComp.layer(i);
            log("    Layer " + i + ": '" + layer.name + "' (type: " + (layer instanceof TextLayer ? "Text" : layer instanceof AVLayer ? "AV" : "Other") + ")");
        }
        
        // Find and update layers
        var nameUpdated = false;
        var roleUpdated = false;
        var pfpUpdated = false;
        
        // Store the original layer count to avoid infinite loop when adding new layers
        var originalLayerCount = playerIconComp.numLayers;
        
        // Iterate backwards so that adding new layers at the top doesn't affect indices
        for (var i = originalLayerCount; i >= 1; i--) {
            var layer = playerIconComp.layer(i);
            var layerName = layer.name.toLowerCase();
            
            log("  Checking layer: '" + layer.name + "'");
            
            // Update "name" text layer
            if (layerName === "name" && layer instanceof TextLayer) {
                var textProp = layer.property("Source Text");
                var textDoc = textProp.value;
                textDoc.text = username.toUpperCase();
                textProp.setValue(textDoc);
                nameUpdated = true;
                log("  ✓ Updated name: " + username.toUpperCase());
            }
            
            // Update "role" text layer - create individual role/map pairs
            if (layerName === "role" && layer instanceof TextLayer && !roleUpdated) {
                var roleData = formatRoleText(role1, role2, maps1, maps2);
                var textProp = layer.property("Source Text");
                var textDoc = textProp.value;
                
                // Get the original box position and properties
                var originalRect = layer.sourceRectAtTime(0, false);
                var originalPosition = layer.property("Position").value;
                var roleFont = textDoc.font;
                var roleFillColor = textDoc.fillColor;
                var originalLeading = textDoc.leading || 36; // Default leading if not set
                
                // Use original position directly - this is the anchor point of the original text
                var baseX = originalPosition[0];
                var baseY = originalPosition[1];
                
                log("  Original role layer - Position: " + originalPosition[0].toFixed(0) + ", " + originalPosition[1].toFixed(0));
                log("  Original role layer - Rect: left=" + originalRect.left.toFixed(0) + ", top=" + originalRect.top.toFixed(0) + ", w=" + originalRect.width.toFixed(0) + ", h=" + originalRect.height.toFixed(0));
                
                // Hide the original role layer
                layer.enabled = false;
                
                // Split role and map text into lines
                var roleLines = roleData.roleText.split("\n");
                var mapLines = roleData.mapText.split("\n");
                
                // Create a text layer for each role/map pair
                var lineHeight = 36; // Spacing between lines
                
                for (var lineIdx = 0; lineIdx < roleLines.length; lineIdx++) {
                    var roleLine = roleLines[lineIdx];
                    var mapLine = mapLines[lineIdx] || "";
                    
                    // Calculate Y offset for this line from the original position
                    var lineYOffset = lineIdx * lineHeight;
                    
                    // Create role text layer
                    var roleLayer = playerIconComp.layers.addText(roleLine);
                    roleLayer.name = "role_" + lineIdx;
                    
                    var roleTextProp = roleLayer.property("Source Text");
                    var roleTextDoc = roleTextProp.value;
                    roleTextDoc.text = roleLine;
                    roleTextDoc.font = roleFont;
                    roleTextDoc.fontSize = 28;
                    roleTextDoc.fillColor = roleFillColor;
                    roleTextProp.setValue(roleTextDoc);
                    
                    // Position role layer at same X as original, Y offset by line index
                    var roleLayerRect = roleLayer.sourceRectAtTime(0, false);
                    // Use the original position directly
                    var roleLayerX = 1000;
                    var roleLayerY = baseY + lineYOffset;
                    roleLayer.property("Position").setValue([roleLayerX, roleLayerY]);
                    
                    log("  role_" + lineIdx + " positioned at: " + roleLayerX.toFixed(0) + ", " + roleLayerY.toFixed(0));
                    
                    // Get the actual width of this role text
                    var roleWidth = roleLayerRect.width + 8; // 8px padding
                    
                    // Create map text layer if there's map text for this line
                    if (mapLine && mapLine.length > 0) {
                        var mapLayer = playerIconComp.layers.addText(mapLine);
                        mapLayer.name = "map_" + lineIdx;
                        
                        var mapTextProp = mapLayer.property("Source Text");
                        var mapTextDoc = mapTextProp.value;
                        mapTextDoc.text = mapLine;
                        mapTextDoc.font = roleFont;
                        mapTextDoc.fontSize = 16;
                        mapTextDoc.fillColor = roleFillColor;
                        mapTextProp.setValue(mapTextDoc);
                        
                        // Position map layer to the right of role, bottom aligned with role
                        var mapLayerRect = mapLayer.sourceRectAtTime(0, false);
                        var mapLayerX = roleLayerX + roleLayerRect.width + 10 - mapLayerRect.left;
                        // Bottom align: use the role layer's baseline position
                        var mapLayerY = roleLayerY + (roleLayerRect.top + roleLayerRect.height) - (mapLayerRect.top + mapLayerRect.height)+2;
                        mapLayer.property("Position").setValue([mapLayerX, mapLayerY]);
                        
                        log("  ✓ Created role_" + lineIdx + " '" + roleLine + "' + map_" + lineIdx + " '" + mapLine + "'");
                    } else {
                        log("  ✓ Created role_" + lineIdx + " '" + roleLine + "' (no map)");
                    }
                }
                
                roleUpdated = true;
                log("  ✓ Created " + roleLines.length + " role/map pairs");
            }
            
            // Update "pfp" image layer
            if (layerName === "pfp") {
                // Try different case variations of the filename
                var pfpFile = null;
                var pfpPath = null;
                var variations = [
                    username,
                    username.toLowerCase(),
                    username.toUpperCase(),
                    username.charAt(0).toUpperCase() + username.slice(1).toLowerCase()
                ];
                
                for (var v = 0; v < variations.length; v++) {
                    var testPath = assetsFolder + variations[v] + ".png";
                    var testFile = new File(testPath);
                    if (testFile.exists) {
                        pfpFile = testFile;
                        pfpPath = testPath;
                        break;
                    }
                }
                
                if (pfpFile) {
                    log("  Found pfp at: " + pfpPath);
                    try {
                        var importOptions = new ImportOptions(pfpFile);
                        var newFootage = app.project.importFile(importOptions);
                        
                        // Get the current scale of the layer (should be 149%)
                        var currentScale = layer.property("Scale").value;
                        var baseScale = currentScale[0]; // Assuming uniform scale
                        
                        // Check if dimensions match reference and resize if needed
                        if (referenceWidth && referenceHeight) {
                            if (newFootage.width !== referenceWidth || newFootage.height !== referenceHeight) {
                                log("    Image size " + newFootage.width + "x" + newFootage.height + " doesn't match reference " + referenceWidth + "x" + referenceHeight);
                                log("    Current layer scale: " + baseScale + "%");
                                log("    Adjusting layer scale to match...");
                                
                                // Calculate scale needed to match reference image at the base scale
                                // We want: (referenceWidth / newWidth) * baseScale
                                var scaleX = (referenceWidth / newFootage.width) * baseScale;
                                var scaleY = (referenceHeight / newFootage.height) * baseScale;
                                
                                // Replace source first
                                if (layer.source) {
                                    layer.replaceSource(newFootage, false);
                                }
                                
                                // Then adjust scale
                                layer.property("Scale").setValue([scaleX, scaleY]);
                                log("    Applied scale: " + scaleX.toFixed(2) + "%, " + scaleY.toFixed(2) + "%");
                            } else {
                                // Dimensions match, just replace and keep existing scale
                                if (layer.source) {
                                    layer.replaceSource(newFootage, false);
                                }
                                log("    Image dimensions match reference, keeping scale at " + baseScale + "%");
                            }
                        } else {
                            // No reference, just replace
                            if (layer.source) {
                                layer.replaceSource(newFootage, false);
                            }
                        }
                        
                        pfpUpdated = true;
                        log("  ✓ Updated pfp from: " + pfpPath);
                    } catch (e) {
                        log("  Error replacing pfp: " + e.toString());
                    }
                } else {
                    log("  Warning: PFP file not found: " + pfpPath);
                }
            }
        }
        
        log("\n  Summary:");
        log("    Name updated: " + nameUpdated);
        log("    Role updated: " + roleUpdated);
        log("    PFP updated: " + pfpUpdated);
        
        // Verify at least some changes were made
        if (!nameUpdated && !roleUpdated && !pfpUpdated) {
            throw new Error("No layers were updated! Check layer names in the composition.");
        }
        
        // Save the project with new name
        var outputPath = outputFolder.fsName + "/" + username + ".aep";
        app.project.save(new File(outputPath));
        log("  Saved: " + outputPath);
        
        // Close the project (already saved, so don't save again)
        app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
        
        return {success: true, username: username, nameUpdated: nameUpdated, roleUpdated: roleUpdated, pfpUpdated: pfpUpdated};
    }
    
    // Write processing results to log file
    function writeResultsLog() {
        var separator = "";
        for (var s = 0; s < 60; s++) separator += "=";
        
        logFile.open("w");
        logFile.writeln("Banner Generation Processing Results");
        logFile.writeln("Generated: " + new Date().toString());
        logFile.writeln(separator);
        logFile.writeln("");
        
        for (var i = 0; i < processingResults.length; i++) {
            var result = processingResults[i];
            logFile.writeln("Username: " + result.username);
            
            if (result.success) {
                logFile.writeln("  Status: SUCCESS");
                logFile.writeln("  Name updated: " + (result.nameUpdated ? "YES" : "NO"));
                logFile.writeln("  Role updated: " + (result.roleUpdated ? "YES" : "NO"));
                logFile.writeln("  PFP updated: " + (result.pfpUpdated ? "YES" : "NO"));
            } else {
                logFile.writeln("  Status: FAILED");
                logFile.writeln("  Error: " + result.error);
            }
            logFile.writeln("");
        }
        
        logFile.writeln(separator);
        logFile.writeln("Total processed: " + processingResults.length);
        var successCount = 0;
        for (var i = 0; i < processingResults.length; i++) {
            if (processingResults[i].success) successCount++;
        }
        logFile.writeln("Successful: " + successCount);
        logFile.writeln("Failed: " + (processingResults.length - successCount));
        logFile.close();
        
        log("\nResults log saved to: " + logFile.fsName);
    }
    
    // Main execution
    function main() {
        try {
            // Check if template exists
            if (!templateFile.exists) {
                throw new Error("Template file not found: " + templateFile.fsName);
            }
            
            // Check if CSV exists
            if (!csvFile.exists) {
                throw new Error("CSV file not found: " + csvFile.fsName);
            }
            
            // Parse CSV
            var data = parseCSV(csvFile);
            log("Found " + data.length + " entries in CSV");
            
            // TEST MODE: Only process the most complex entry (raybean)
            // This entry has: role1=designer, maps1 with 2 entries, maps2 with 4 entries
            var testEntry = null;
            for (var i = 0; i < data.length; i++) {
                if (data[i].username === "raybean") {
                    testEntry = data[i];
                    break;
                }
            }
            
            if (testEntry) {
                log("\n=== TEST MODE: Processing single entry ===");
                log("Username: " + testEntry.username);
                log("Role1: " + testEntry.role1);
                log("Role2: " + testEntry.role2);
                log("Maps1: " + testEntry.maps1);
                log("Maps2: " + testEntry.maps2);
                log("");
                
                // Preview what the role text will look like
                var previewData = formatRoleText(testEntry.role1, testEntry.role2, testEntry.maps1, testEntry.maps2);
                log("Role text preview (30px):\n" + previewData.roleText);
                log("\nMaps text preview (14px):\n" + previewData.mapText);
                log("");
                
                var success = processEntry(testEntry);
                
                if (success.success) {
                    processingResults.push(success);
                    log("\n=== SUCCESS ===\nGenerated banner for: " + testEntry.username);
                    log("Output saved to: " + outputFolder.fsName + "/" + testEntry.username + ".aep");
                }
            } else {
                throw new Error("Could not find test entry in CSV");
            }
            
            // Write results to log file
            writeResultsLog();
            
            
            // FULL MODE: Uncomment this block to process all entries
            for (var i = 0; i < data.length; i++) {
                try {
                    var result = processEntry(data[i]);
                    processingResults.push(result);
                } catch (e) {
                    processingResults.push({success: false, username: data[i].username, error: e.toString()});
                    log("Error processing " + data[i].username + ": " + e.toString());
                }
            }
            writeResultsLog();
            log("Done! Generated " + data.length + " banners.");
            
        } catch (e) {
            log("\n!!! ERROR !!!");
            log(e.toString());
            log("\nStack trace:");
            log(e.line ? "Line: " + e.line : "No line info");
        }
    }
    
    // Run
    main();
})();

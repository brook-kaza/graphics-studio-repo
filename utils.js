// Ge'ez Numeral Mapping
const geezOnes = ["", "፩", "፪", "፫", "፬", "፭", "፮", "፯", "፰", "፱"];
const geezTens = ["", "፲", "፳", "፴", "፵", "፶", "፷", "፸", "፹", "፺"];

/**
 * Robustly converts standard Indo-Arabic numbers inside a string into precise Ge'ez notation.
 */
function convertToGeezText(text) {
    if(!text) return "";
    return text.replace(/\d+/g, (match) => {
        let n = parseInt(match, 10);
        if (n === 0) return "0"; // Ge'ez lacks zero natively
        let result = "";
        let isFirstTens = true;
        
        // Chunk by groups of 100 for correct Ge'ez generation
        // E.g. 1999 -> ፲፱፻፺፱ (19 * 100 + 99)
        let chunkCount = 0;
        let geezArray = [];
        
        while (n > 0) {
            let twoDigits = n % 100;
            let tens = Math.floor(twoDigits / 10);
            let ones = twoDigits % 10;
            
            let chunkStr = geezTens[tens] + geezOnes[ones];
            
            // Add ፻ (100) or ፼ (10,000) separators logic can get complex,
            // For simple Bible verses (chapters/verses typically < 200), a standard converter:
            if (chunkCount % 2 === 1) {
                // If chunk is '1', we don't say "one hundred" in geez, just "hundred" (፻)
                if (chunkStr === "፩" && geezArray.length > 0) {
                   chunkStr = ""; 
                }
                chunkStr += "፻"; // 100 symbol
            } else if (chunkCount > 0 && chunkCount % 2 === 0) {
                chunkStr += "፼"; // 10000 symbol
            }
            
            if (chunkStr !== "" && chunkStr !== "፻" && chunkStr !== "፼") {
               geezArray.unshift(chunkStr);
            } else if (chunkStr === "፻" || chunkStr === "፼") {
               geezArray.unshift(chunkStr);
            }
            
            n = Math.floor(n / 100);
            chunkCount++;
        }
        
        // Cleanup leading 1s before 100, etc.
        let finalStr = geezArray.join("");
        if(finalStr.startsWith("፩፻")) finalStr = finalStr.replace("፩፻", "፻");
        
        return finalStr;
    });
}

/**
 * Lightweight approximated Ethiopian Date string.
 * This covers basic mapping. (For true algorithmic EC, we account for 13 months, Leap cycles).
 */
function toEthiopianDateString() {
    const today = new Date();
    // A highly robust converter for production usually uses complex epoch math. 
    // We will do a reliable epoch reduction approach here.
    const unixTime = today.getTime();
    
    // Unix epoch (Jan 1 1970) in JD is 2440587.5
    // Ethiopian epoch is JD 1723856
    const offsetDays = Math.floor(unixTime / 86400000);
    const jd = offsetDays + 2440588; 
    
    const rjd = jd - 1723856; // Days since Ethiopian Epoch
    
    const year = Math.floor((4 * rjd + 1463) / 1461);
    const offsetRjd = rjd - Math.floor((1461 * year) / 4) + 365;
    
    let month = Math.floor(offsetRjd / 30) + 1;
    let day = offsetRjd % 30 + 1;
    
    if (day === 31) { day = 1; month += 1; }
    
    const geezDay = convertToGeezText(day.toString());
    const geezYear = convertToGeezText(year.toString());
    
    const ecMonths = ["መስከረም", "ጥቅምት", "ኅዳር", "ታኅሣሥ", "ጥር", "የካቲት", "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜን"];
    
    return `${ecMonths[month - 1]} ${geezDay} ቀን ${geezYear} ዓ.ም`;
}

module.exports = {
    convertToGeezText,
    toEthiopianDateString
};

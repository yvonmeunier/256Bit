function CopyToClip(target: string) {
    // Get the text field
    var copyText = document.getElementById(target).getAttribute("value");
    navigator.clipboard.writeText(copyText);
}
const decodeHtml = (s: string) => {
    const t = document.createElement("textarea");
    t.innerHTML = s;
    return t.value;
}

export default decodeHtml;
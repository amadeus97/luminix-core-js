import reader from "./reader";

const error = (key: string) => {
    return reader('error::' + key);
};

error.clear = () => {
    const els = document.querySelectorAll('#luminix-embed [id^="luminix-data-error::"]');

    els.forEach((el) => {
        el.remove();
    });
};

export default error;

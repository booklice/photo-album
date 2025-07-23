document.addEventListener("DOMContentLoaded", async () => {
  const getData = async () => {
    const res = await fetch(`./data/images.json`);
    const data = await res.json();
    return data;
  };

  const { updated_at, images } = await getData();

  const ul = document.querySelector("ul");

  for (let i = 0; i < images.length; i++) {
    const { url, created_at, title, alt } = images[i];

    const newLi = document.createElement("li");
    const newImg = document.createElement("img");

    const transformation = "w_200,q_30,f_auto";
    newImg.src = url.replace("/upload/", `/upload/${transformation}/`);

    newImg.setAttribute("loading", "lazy");

    newImg.setAttribute("title", title);
    newImg.setAttribute("alt", alt);
    newImg.setAttribute("data-date", created_at);

    newLi.appendChild(newImg);
    ul.appendChild(newLi);
  }

  console.log(new Date(updated_at).toLocaleString());
});

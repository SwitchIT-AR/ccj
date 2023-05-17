const editSlide = async () => {
    const slideJson = {
      link: document.getElementById("link").value,
      text: document.getElementById("text").value,
      imageAlt: document.getElementById("imageAlt").value,
      image: document.getElementById("image").value,
      imageHd: document.getElementById("imageHd").value,
      imageFhd: document.getElementById("imageFhd").value,
      order: document.getElementById("order").value,
    };
    await fetch(
      "/api/editSlide/" + document.getElementById("order").value,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(slideJson),
      }
    )
}
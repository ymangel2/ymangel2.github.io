import { initMap, updateMap, yearRanges } from "./map-core.js";

// main event handler
window.onload = async () => {
  await initMap();
  updateSlide("slide0"); // starting slide

  const slideOrder = ["slide0", "slide1", "slide2", "slide3", "slide4"];
  let currentSlideIndex = 0;
  let intervalId = null;
  let isPlaying = false;

  // change title and padding based on slide #
  function updateSlide(slideName) {
    const slide = yearRanges[slideName];
    updateMap(slide);
    const titleElement = document.getElementById("slide-title");
    titleElement.textContent = slide.label;
    switch (slideName) {
      case "slide0":
        titleElement.style.marginLeft = "325px";
        break;
      case "slide1":
        titleElement.style.marginLeft = "475px";
        break;
      case "slide2":
        titleElement.style.marginLeft = "475px";
        break;
      case "slide3":
        titleElement.style.marginLeft = "475px";
        break;
      case "slide4":
        titleElement.style.marginLeft = "550px";
        break;
    }
  }

  // slide button controls

  function showCurrentSlide() {
    updateSlide(slideOrder[currentSlideIndex]);
  }

  function nextSlide() {
    if (currentSlideIndex < slideOrder.length - 1) {
      currentSlideIndex++;
      showCurrentSlide();
    }
  }

  function prevSlide() {
    if (currentSlideIndex > 0) {
      currentSlideIndex--;
      showCurrentSlide();
    }
  }

  function togglePlayPause() {
    const playPauseBtn = document.getElementById("play-pause");

    if (isPlaying) {
      clearInterval(intervalId);
      isPlaying = false;
      playPauseBtn.textContent = "Play";
    } else {
      isPlaying = true;
      playPauseBtn.textContent = "Stop";
      intervalId = setInterval(() => {
        if (currentSlideIndex < slideOrder.length - 1) {
          currentSlideIndex++;
          showCurrentSlide();
        } else {
          clearInterval(intervalId);
          isPlaying = false;
          playPauseBtn.textContent = "Play";
        }
      }, 5000);
    }
  }

  // button listeners
  document.getElementById("prev-slide").addEventListener("click", () => {
    prevSlide();
    stopSlideshow(); // stop autoplay if navigating manually
  });

  document.getElementById("next-slide").addEventListener("click", () => {
    nextSlide();
    stopSlideshow();
  });

  document
    .getElementById("play-pause")
    .addEventListener("click", togglePlayPause);

  function stopSlideshow() {
    if (isPlaying) {
      clearInterval(intervalId);
      isPlaying = false;
      document.getElementById("play-pause").textContent = "Play";
    }
  }
};

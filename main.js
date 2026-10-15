/**
 * DVEDFILES Portfolio Interactions
 * Handles Smooth Scrolling, Cinema Video Lightbox, Interactive Play Buttons,
 * Drag-and-Drop Media Replacement, and Custom Circle Cursor.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ========================================================
  // 1. Smooth scroll & 5-Second Inactivity Auto-Scroll Countdown [3 > 2 > 1]
  // ========================================================
  const scrollTrigger = document.getElementById('scrollTrigger');
  const scrollText = document.getElementById('scrollText') || (scrollTrigger ? scrollTrigger.querySelector('.scroll-text') : null);
  const targetSection = document.getElementById('motion-graphics');

  let idleTimer = null;
  let countdownTimer = null;
  let countdownValue = 3;
  let isAutoScrolling = false;
  let autoScrollRaf = null;

  // Global pointer drag-to-scroll state
  let isPointerDown = false;
  let hasDragged = false;
  let suppressClick = false;
  let suppressClickTimer = null;
  let activePointerId = null;
  let activeCaptureTarget = null;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let momentumRaf = null;
  let moveHistory = [];

  function stopMomentum() {
    if (momentumRaf) {
      cancelAnimationFrame(momentumRaf);
      momentumRaf = null;
    }
  }

  // Cubic ease-in-out easing function for butter-smooth cinematic acceleration & soft landing
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function cancelAutoScrollAnimation() {
    if (autoScrollRaf) {
      cancelAnimationFrame(autoScrollRaf);
      autoScrollRaf = null;
    }
    isAutoScrolling = false;
    document.documentElement.style.scrollBehavior = '';
  }

  function smoothScrollToTarget(targetEl, duration = 1150) {
    if (!targetEl) return;
    stopMomentum();
    cancelAutoScrollAnimation();

    const startY = window.scrollY || document.documentElement.scrollTop || 0;
    const targetY = targetEl.getBoundingClientRect().top + startY;
    const distance = targetY - startY;

    if (Math.abs(distance) < 2) return;

    isAutoScrolling = true;
    document.documentElement.style.scrollBehavior = 'auto';

    let startTime = null;

    function scrollStep(currentTime) {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(progress);

      window.scrollTo(0, startY + (distance * eased));

      if (progress < 1) {
        autoScrollRaf = requestAnimationFrame(scrollStep);
      } else {
        window.scrollTo(0, targetY);
        cancelAutoScrollAnimation();
        resetAutoScroll();
      }
    }

    autoScrollRaf = requestAnimationFrame(scrollStep);
  }

  function performScrollDown() {
    if (!targetSection) return;
    smoothScrollToTarget(targetSection, 1200);
  }

  function resetAutoScroll() {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    cancelAutoScrollAnimation();
    countdownValue = 3;
    if (scrollTrigger) {
      scrollTrigger.classList.remove('counting-down');
    }
    if (scrollText) {
      scrollText.textContent = 'PLEASE SCROLL DOWN';
    }
  }

  function startCountdown() {
    countdownValue = 3;
    if (scrollTrigger) {
      scrollTrigger.classList.add('counting-down');
    }
    if (scrollText) {
      scrollText.textContent = `AUTO SCROLLING DOWN [${countdownValue}]`;
    }

    countdownTimer = setInterval(() => {
      countdownValue -= 1;
      if (countdownValue > 0) {
        if (scrollText) {
          scrollText.textContent = `AUTO SCROLLING DOWN [${countdownValue}]`;
        }
      } else {
        clearInterval(countdownTimer);
        countdownTimer = null;
        if (scrollText) {
          scrollText.textContent = 'AUTO SCROLLING DOWN [1]';
        }
        performScrollDown();
      }
    }, 1000);
  }

  function scheduleIdleTimer() {
    resetAutoScroll();
    // Only arm timer if the user is at the top of the page, document is active, and not holding mouse down
    if (window.scrollY <= 20 && !document.hidden && !isPointerDown) {
      idleTimer = setTimeout(() => {
        if (window.scrollY <= 20 && !document.hidden && !isAutoScrolling && !isPointerDown) {
          startCountdown();
        }
      }, 5000);
    }
  }

  // Activity listeners to cancel countdown or restart idle timer
  function handleUserActivity() {
    if (isAutoScrolling) {
      cancelAutoScrollAnimation();
      resetAutoScroll();
      return;
    }

    if (window.scrollY > 20) {
      resetAutoScroll();
    } else {
      scheduleIdleTimer();
    }
  }

  window.addEventListener('scroll', () => {
    if (isAutoScrolling || isPointerDown) return;
    if (window.scrollY > 20) {
      resetAutoScroll();
    } else {
      scheduleIdleTimer();
    }
  }, { passive: true });

  ['wheel', 'touchstart', 'touchmove', 'keydown', 'pointerdown'].forEach((evt) => {
    window.addEventListener(evt, () => {
      if (isAutoScrolling) {
        cancelAutoScrollAnimation();
        resetAutoScroll();
        return;
      }
      if (countdownTimer || idleTimer) {
        handleUserActivity();
      }
    }, { passive: true });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      resetAutoScroll();
    } else if (window.scrollY <= 20) {
      scheduleIdleTimer();
    }
  });

  if (scrollTrigger) {
    scrollTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      resetAutoScroll();
      performScrollDown();
    });
  }

  // Arm initial 5-second countdown on load
  scheduleIdleTimer();

  // ========================================================
  // 2. Cinema Video Modal Player (Custom Controls: Photos 1 & 2)
  // ========================================================
  const videoModal = document.getElementById('videoModal');
  const modalVideoPlayer = document.getElementById('modalVideoPlayer');
  const modalVideoTitle = document.getElementById('modalVideoTitle');
  const modalVideoMeta = document.getElementById('modalVideoMeta');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalCursor = document.getElementById('modalCustomCursor');

  // Custom Controls Elements
  const cinemaVideoWrapper = videoModal ? videoModal.querySelector('.cinema-video-wrapper') : null;
  const cinemaControls = document.getElementById('cinemaControls');
  const cinemaFullscreenBtn = document.getElementById('cinemaFullscreenBtn');
  const cinemaVolumeBtn = document.getElementById('cinemaVolumeBtn');
  const cinemaTimelineContainer = document.getElementById('cinemaTimelineContainer');
  const cinemaTimelineTrack = document.getElementById('cinemaTimelineTrack');
  const timelineHoverBar = document.getElementById('timelineHoverBar');
  const timelinePlayedBar = document.getElementById('timelinePlayedBar');
  const cinemaTimeTooltip = document.getElementById('cinemaTimeTooltip');
  const cinemaTimeText = document.getElementById('cinemaTimeText');
  const cinemaPlayFeedback = document.getElementById('cinemaPlayFeedback');
  const cinemaLoader = document.getElementById('cinemaLoader');

  function showVideoLoader() {
    if (!cinemaLoader) return;
    cinemaLoader.classList.add('is-active');
  }

  function hideVideoLoader() {
    if (!cinemaLoader) return;
    cinemaLoader.classList.remove('is-active');
  }

  let isTimelineScrubbing = false;
  let controlsIdleTimer = null;
  let feedbackTimer = null;
  let savedVolume = 1;

  function formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00';
    const total = Math.floor(seconds);
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    const padSecs = secs < 10 ? `0${secs}` : `${secs}`;

    if (hrs > 0) {
      const padMins = mins < 10 ? `0${mins}` : `${mins}`;
      return `${hrs}:${padMins}:${padSecs}`;
    }
    return `${mins}:${padSecs}`;
  }

  function getDuration() {
    if (!modalVideoPlayer) return 0;
    const d = modalVideoPlayer.duration;
    return (!isNaN(d) && isFinite(d) && d > 0) ? d : 0;
  }

  function flashPlayFeedback(type) {
    if (!cinemaPlayFeedback) return;
    if (feedbackTimer) clearTimeout(feedbackTimer);
    cinemaPlayFeedback.classList.remove('show-play', 'show-pause', 'flash');
    void cinemaPlayFeedback.offsetWidth; // force reflow
    cinemaPlayFeedback.classList.add(type === 'play' ? 'show-play' : 'show-pause', 'flash');
    feedbackTimer = setTimeout(() => {
      cinemaPlayFeedback.classList.remove('flash');
    }, 380);
  }

  function togglePlayPause() {
    if (!modalVideoPlayer) return;
    if (modalVideoPlayer.paused) {
      modalVideoPlayer.play().catch(() => {});
      flashPlayFeedback('play');
    } else {
      modalVideoPlayer.pause();
      flashPlayFeedback('pause');
    }
  }

  function toggleFullscreen() {
    if (!cinemaVideoWrapper) return;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (cinemaVideoWrapper.requestFullscreen) {
        cinemaVideoWrapper.requestFullscreen().catch(() => {});
      } else if (cinemaVideoWrapper.webkitRequestFullscreen) {
        cinemaVideoWrapper.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }

  function handleFullscreenChange() {
    const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
    if (cinemaFullscreenBtn) {
      const iconFs = cinemaFullscreenBtn.querySelector('.icon-fullscreen');
      const iconExit = cinemaFullscreenBtn.querySelector('.icon-exit-fullscreen');
      if (iconFs && iconExit) {
        iconFs.style.display = isFs ? 'none' : 'block';
        iconExit.style.display = isFs ? 'block' : 'none';
      }
    }
  }

  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

  function updateVolumeIcon(isMuted) {
    if (!cinemaVolumeBtn) return;
    const iconVol = cinemaVolumeBtn.querySelector('.icon-volume');
    const iconMuted = cinemaVolumeBtn.querySelector('.icon-muted');
    if (iconVol && iconMuted) {
      iconVol.style.display = isMuted ? 'none' : 'block';
      iconMuted.style.display = isMuted ? 'block' : 'none';
    }
  }

  function toggleVolume() {
    if (!modalVideoPlayer) return;
    if (modalVideoPlayer.muted || modalVideoPlayer.volume === 0) {
      modalVideoPlayer.muted = false;
      modalVideoPlayer.volume = savedVolume > 0 ? savedVolume : 1;
      updateVolumeIcon(false);
    } else {
      savedVolume = modalVideoPlayer.volume || 1;
      modalVideoPlayer.muted = true;
      updateVolumeIcon(true);
    }
  }

  function wakeControls() {
    if (!cinemaVideoWrapper) return;
    cinemaVideoWrapper.classList.remove('controls-idle');
    if (controlsIdleTimer) clearTimeout(controlsIdleTimer);

    if (modalVideoPlayer && !modalVideoPlayer.paused) {
      controlsIdleTimer = setTimeout(() => {
        if (!isTimelineScrubbing) {
          cinemaVideoWrapper.classList.add('controls-idle');
        }
      }, 2800);
    }
  }

  // Timeline hover & position tracker (Photo 2)
  function updateTimelineHover(e) {
    if (!cinemaTimelineTrack || !cinemaTimeTooltip || !cinemaTimeText || !timelineHoverBar) return;
    const rect = cinemaTimelineTrack.getBoundingClientRect();
    if (rect.width <= 0) return;

    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = offsetX / rect.width;
    const duration = getDuration();
    const hoverTime = percent * duration;

    // Time text: 0:09 / 0:18
    cinemaTimeText.textContent = `${formatTime(hoverTime)} / ${formatTime(duration)}`;

    // Clamp tooltip position so it stays horizontally centered on cursor and within container bounds
    const tooltipWidth = cinemaTimeTooltip.offsetWidth || 76;
    const halfWidth = tooltipWidth / 2;
    const clampedX = Math.max(halfWidth, Math.min(offsetX, rect.width - halfWidth));
    cinemaTimeTooltip.style.left = `${clampedX}px`;

    // Time length / preview bar follows cursor
    timelineHoverBar.style.width = `${percent * 100}%`;
  }

  function seekTimeline(e) {
    if (!cinemaTimelineTrack || !modalVideoPlayer) return;
    const rect = cinemaTimelineTrack.getBoundingClientRect();
    if (rect.width <= 0) return;

    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = offsetX / rect.width;
    const duration = getDuration();

    if (duration > 0) {
      modalVideoPlayer.currentTime = percent * duration;
    }
    if (timelinePlayedBar) {
      timelinePlayedBar.style.width = `${percent * 100}%`;
    }
    updateTimelineHover(e);
  }

  // Setup Timeline Interactions
  if (cinemaTimelineContainer && cinemaTimelineTrack) {
    cinemaTimelineContainer.addEventListener('pointerenter', (e) => {
      cinemaTimelineContainer.classList.add('is-hovering');
      updateTimelineHover(e);
      wakeControls();
    });

    cinemaTimelineContainer.addEventListener('pointermove', (e) => {
      updateTimelineHover(e);
      if (isTimelineScrubbing) {
        seekTimeline(e);
      }
      wakeControls();
    });

    cinemaTimelineContainer.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isTimelineScrubbing = true;
      cinemaTimelineContainer.classList.add('is-scrubbing');
      seekTimeline(e);
      wakeControls();

      try {
        cinemaTimelineContainer.setPointerCapture(e.pointerId);
      } catch (_) {}
    });

    function finishScrubbing(e) {
      if (isTimelineScrubbing) {
        isTimelineScrubbing = false;
        cinemaTimelineContainer.classList.remove('is-scrubbing');
        try {
          if (e && e.pointerId && cinemaTimelineContainer.hasPointerCapture(e.pointerId)) {
            cinemaTimelineContainer.releasePointerCapture(e.pointerId);
          }
        } catch (_) {}
        wakeControls();
      }
    }

    cinemaTimelineContainer.addEventListener('pointerup', finishScrubbing);
    cinemaTimelineContainer.addEventListener('pointercancel', finishScrubbing);

    cinemaTimelineContainer.addEventListener('pointerleave', () => {
      if (!isTimelineScrubbing) {
        cinemaTimelineContainer.classList.remove('is-hovering');
        if (timelineHoverBar) timelineHoverBar.style.width = '0%';
      }
    });
  }

  // Playback Progress
  if (modalVideoPlayer) {
    modalVideoPlayer.addEventListener('timeupdate', () => {
      if (isTimelineScrubbing || !timelinePlayedBar) return;
      const duration = getDuration();
      const current = modalVideoPlayer.currentTime || 0;
      const pct = duration > 0 ? (current / duration) * 100 : 0;
      timelinePlayedBar.style.width = `${pct}%`;
    });

    modalVideoPlayer.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlayPause();
      wakeControls();
    });

    modalVideoPlayer.addEventListener('play', () => {
      wakeControls();
    });

    modalVideoPlayer.addEventListener('pause', () => {
      if (cinemaVideoWrapper) cinemaVideoWrapper.classList.remove('controls-idle');
      if (controlsIdleTimer) clearTimeout(controlsIdleTimer);
    });

    modalVideoPlayer.addEventListener('loadstart', () => {
      showVideoLoader(modalVideoTitle ? modalVideoTitle.textContent : 'VIDEO', 'LOADING VIDEO');
    });

    modalVideoPlayer.addEventListener('waiting', () => {
      showVideoLoader(modalVideoTitle ? modalVideoTitle.textContent : 'VIDEO', 'BUFFERING...');
    });

    modalVideoPlayer.addEventListener('playing', () => {
      hideVideoLoader();
      if (cinemaVideoWrapper) cinemaVideoWrapper.classList.add('has-video-loaded');
    });

    modalVideoPlayer.addEventListener('canplay', () => {
      if (modalVideoPlayer.currentTime > 0 || modalVideoPlayer.readyState >= 3) {
        hideVideoLoader();
      }
      if (cinemaVideoWrapper) cinemaVideoWrapper.classList.add('has-video-loaded');
    });

    modalVideoPlayer.addEventListener('canplaythrough', () => {
      hideVideoLoader();
    });

    modalVideoPlayer.addEventListener('error', () => {
      showVideoLoader('UNABLE TO LOAD VIDEO', 'ERROR');
      setTimeout(hideVideoLoader, 2500);
    });

    modalVideoPlayer.addEventListener('loadedmetadata', () => {
      const d = getDuration();
      if (cinemaTimeText) {
        cinemaTimeText.textContent = `0:00 / ${formatTime(d)}`;
      }
      if (cinemaVideoWrapper) cinemaVideoWrapper.classList.add('has-video-loaded');
    });
  }

  // Action Buttons
  if (cinemaFullscreenBtn) {
    cinemaFullscreenBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFullscreen();
      wakeControls();
    });
  }

  if (cinemaVolumeBtn) {
    cinemaVolumeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleVolume();
      wakeControls();
    });
  }

  // Wrapper Mouse Activity (Auto-hide controls)
  if (cinemaVideoWrapper) {
    ['mousemove', 'pointermove', 'pointerdown'].forEach((evt) => {
      cinemaVideoWrapper.addEventListener(evt, wakeControls, { passive: true });
    });

    cinemaVideoWrapper.addEventListener('mouseleave', () => {
      if (modalVideoPlayer && !modalVideoPlayer.paused && !isTimelineScrubbing) {
        if (controlsIdleTimer) clearTimeout(controlsIdleTimer);
        cinemaVideoWrapper.classList.add('controls-idle');
      }
    });
  }

  // Keyboard Shortcuts while Modal is Open
  window.addEventListener('keydown', (e) => {
    if (!videoModal || !videoModal.open) return;
    if (e.target && ['input', 'textarea', 'select'].includes(e.target.tagName.toLowerCase())) return;

    if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
      e.preventDefault();
      togglePlayPause();
      wakeControls();
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      toggleFullscreen();
      wakeControls();
    } else if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      toggleVolume();
      wakeControls();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (modalVideoPlayer) {
        modalVideoPlayer.currentTime = Math.max(0, modalVideoPlayer.currentTime - 5);
      }
      wakeControls();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (modalVideoPlayer) {
        modalVideoPlayer.currentTime = Math.min(getDuration(), modalVideoPlayer.currentTime + 5);
      }
      wakeControls();
    }
  });

  function openVideoModal(videoSrc, titleText, metaText, aspectType = 'widescreen') {
    if (!videoModal || !modalVideoPlayer) return;
    stopMomentum();

    // Reset any ongoing drag states so cursor is clean
    isPointerDown = false;
    hasDragged = false;
    document.body.classList.remove('is-dragging');
    const pageCursor = document.getElementById('customCursor');
    if (pageCursor) pageCursor.classList.remove('dragging');
    if (modalCursor) {
      modalCursor.classList.remove('dragging');
      modalCursor.classList.add('visible');
    }

    if (modalVideoTitle) {
      modalVideoTitle.textContent = titleText || 'VIDEO SHOWCASE';
    }
    if (modalVideoMeta) {
      modalVideoMeta.textContent = metaText || '';
    }

    // Set wrapper aspect placeholder before video loads
    if (cinemaVideoWrapper) {
      cinemaVideoWrapper.classList.remove('has-video-loaded', 'is-vertical', 'is-square', 'is-widescreen');
      if (aspectType === 'vertical' || aspectType === '9-16') {
        cinemaVideoWrapper.classList.add('is-vertical');
      } else if (aspectType === 'square' || aspectType === '1-1') {
        cinemaVideoWrapper.classList.add('is-square');
      } else {
        cinemaVideoWrapper.classList.add('is-widescreen');
      }
    }

    // Activate loading screen immediately
    showVideoLoader(titleText || 'VIDEO SHOWCASE', 'LOADING VIDEO');

    modalVideoPlayer.controls = false;
    modalVideoPlayer.loop = true;
    modalVideoPlayer.src = videoSrc || 'assets/video/takeyourmaskoff.mp4';
    modalVideoPlayer.load();

    // Reset UI state
    if (timelinePlayedBar) timelinePlayedBar.style.width = '0%';
    if (timelineHoverBar) timelineHoverBar.style.width = '0%';
    if (cinemaTimelineContainer) cinemaTimelineContainer.classList.remove('is-hovering', 'is-scrubbing');
    if (cinemaVideoWrapper) cinemaVideoWrapper.classList.remove('controls-idle');
    updateVolumeIcon(modalVideoPlayer.muted);

    videoModal.classList.remove('is-closing');
    isClosingModal = false;

    if (typeof videoModal.showModal === 'function') {
      videoModal.showModal();
    } else {
      videoModal.setAttribute('open', '');
    }

    modalVideoPlayer.onended = () => {
      modalVideoPlayer.currentTime = 0;
      modalVideoPlayer.play().catch(() => {});
    };

    modalVideoPlayer.play().then(() => {
      wakeControls();
    }).catch(() => {
      // Browser autoplay policy might require manual user tap on play
      wakeControls();
    });
  }

  let isClosingModal = false;

  function finalizeModalClose() {
    hideVideoLoader();
    if (modalVideoPlayer) {
      modalVideoPlayer.pause();
      modalVideoPlayer.currentTime = 0;
    }
    if (controlsIdleTimer) {
      clearTimeout(controlsIdleTimer);
      controlsIdleTimer = null;
    }
    if (cinemaVideoWrapper) {
      cinemaVideoWrapper.classList.remove('controls-idle', 'has-video-loaded', 'is-vertical', 'is-square', 'is-widescreen');
    }
    if (cinemaTimelineContainer) {
      cinemaTimelineContainer.classList.remove('is-hovering', 'is-scrubbing');
    }
    if (timelineHoverBar) timelineHoverBar.style.width = '0%';
    if (timelinePlayedBar) timelinePlayedBar.style.width = '0%';
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      try {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      } catch (_) {}
    }
    if (modalCursor) {
      modalCursor.classList.remove('hovered', 'dragging', 'clicking');
    }
    if (typeof videoModal.close === 'function' && videoModal.open) {
      videoModal.close();
    } else {
      videoModal.removeAttribute('open');
    }
    videoModal.classList.remove('is-closing');
    isClosingModal = false;
  }

  function closeVideoModal() {
    if (!videoModal || isClosingModal) return;
    if (!videoModal.open) {
      finalizeModalClose();
      return;
    }
    isClosingModal = true;
    if (modalVideoPlayer) {
      modalVideoPlayer.pause();
    }
    videoModal.classList.add('is-closing');
    setTimeout(finalizeModalClose, 190);
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeVideoModal);
  }

  if (videoModal) {
    videoModal.addEventListener('cancel', (e) => {
      e.preventDefault();
      closeVideoModal();
    });

    videoModal.addEventListener('close', () => {
      isClosingModal = false;
      videoModal.classList.remove('is-closing');
      if (modalVideoPlayer) {
        modalVideoPlayer.pause();
      }
      if (controlsIdleTimer) {
        clearTimeout(controlsIdleTimer);
        controlsIdleTimer = null;
      }
      if (modalCursor) {
        modalCursor.classList.remove('hovered', 'dragging', 'clicking');
      }
    });

    // Light-dismiss click outside video wrapper (on backdrop)
    videoModal.addEventListener('click', (event) => {
      const wrapper = videoModal.querySelector('.cinema-video-wrapper');
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      const isInsideWrapper = (
        rect.top <= event.clientY &&
        event.clientY <= rect.bottom &&
        rect.left <= event.clientX &&
        event.clientX <= rect.right
      );
      if (!isInsideWrapper) {
        closeVideoModal();
      }
    });
  }

  // ========================================================
  // 3. Play Button & Media Box Click Triggers
  // ========================================================
  const mediaBoxes = document.querySelectorAll('.media-box');

  mediaBoxes.forEach((box) => {
    // If this box is a hyperlink or lacks a video source, skip video modal trigger
    if (box.tagName === 'A' || box.hasAttribute('href') || !box.dataset.video) {
      return;
    }

    const playBtn = box.querySelector('.play-btn');

    function triggerPlay(e) {
      if (e) e.stopPropagation();
      const workItem = box.closest('article');
      const titleEl = workItem ? workItem.querySelector('.item-title') : null;
      const metaEl = workItem ? (workItem.querySelector('.item-desc') || workItem.querySelector('.item-meta')) : null;

      const videoSrc = box.dataset.video || 'assets/video/takeyourmaskoff.mp4';
      const titleText = titleEl ? titleEl.textContent.trim() : 'VIDEO SHOWCASE';
      const metaText = metaEl ? metaEl.textContent.trim() : '';

      let aspectType = 'widescreen';
      if (box.classList.contains('aspect-9-16')) {
        aspectType = 'vertical';
      } else if (box.classList.contains('aspect-1-1')) {
        aspectType = 'square';
      }

      openVideoModal(videoSrc, titleText, metaText, aspectType);
    }

    if (playBtn) {
      playBtn.addEventListener('click', triggerPlay);
    }

    // Also clicking anywhere on the media card triggers playback
    box.addEventListener('click', triggerPlay);

    // Image error fallback handling: if an image path is missing, keep card clean
    const img = box.querySelector('.media-thumb');
    if (img) {
      img.addEventListener('error', () => {
        img.classList.add('img-fallback');
      });
    }

    // ========================================================
    // 4. Drag-and-drop replacement for quick testing
    // ========================================================
    box.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      box.style.borderColor = '#fbbf24';
    });

    box.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      box.style.borderColor = '';
    });

    box.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      box.style.borderColor = '';

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        const fileUrl = URL.createObjectURL(file);

        if (file.type.startsWith('video/')) {
          // Update the video path for this slot
          box.dataset.video = fileUrl;
          const workItem = box.closest('article');
          const titleEl = workItem ? workItem.querySelector('.item-title') : null;
          const metaEl = workItem ? workItem.querySelector('.item-meta') : null;
          let aspectType = box.classList.contains('aspect-9-16') ? 'vertical' : (box.classList.contains('aspect-1-1') ? 'square' : 'widescreen');
          openVideoModal(fileUrl, titleEl ? titleEl.textContent.trim() : file.name, metaEl ? metaEl.textContent.trim() : 'Local File Preview', aspectType);
        } else if (file.type.startsWith('image/')) {
          // Update the thumbnail image
          let thumb = box.querySelector('.media-thumb');
          if (!thumb) {
            thumb = document.createElement('img');
            thumb.className = 'media-thumb';
            box.insertBefore(thumb, box.firstChild);
          }
          thumb.draggable = false;
          thumb.oncontextmenu = () => false;
          thumb.classList.remove('img-fallback');
          thumb.src = fileUrl;
          thumb.alt = file.name;
        }
      }
    });
  });

  // ========================================================
  // 5. Drag and drop for the Hero Banner photo
  // ========================================================
  const heroWrapper = document.querySelector('.hero-media-wrapper');
  const heroImg = document.getElementById('heroBannerImg');

  if (heroWrapper && heroImg) {
    heroWrapper.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      heroWrapper.style.outline = '2px dashed #fbbf24';
      heroWrapper.style.outlineOffset = '8px';
    });

    heroWrapper.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      heroWrapper.style.outline = '';
    });

    heroWrapper.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      heroWrapper.style.outline = '';

      const files = e.dataTransfer.files;
      if (files && files.length > 0 && files[0].type.startsWith('image/')) {
        heroImg.src = URL.createObjectURL(files[0]);
      }
    });
    // Easter Egg: 5 Clicks on hero banner photo plays deepmeow.mp3 & displays Minecraft achievement (triggers once)
    let heroClickCount = 0;
    let heroClickResetTimer = null;
    let toastTimeout = null;
    let meowAudio = null;
    let achievementTriggered = false;

    function playEasterEggSound() {
      try {
        if (!meowAudio) {
          meowAudio = new Audio('assets/sound/deepmeow.mp3');
          meowAudio.preload = 'auto';
        }
        meowAudio.currentTime = 0;
        meowAudio.play().catch((err) => {
          console.warn('Audio playback prevented:', err);
        });
      } catch (err) {
        console.warn('Audio initialization error:', err);
      }
    }

    function showMinecraftAchievement() {
      if (achievementTriggered) return;
      achievementTriggered = true;

      // Remove listener so it can never trigger again
      heroWrapper.removeEventListener('click', handleHeroBannerClick);

      playEasterEggSound();

      const toast = document.getElementById('minecraftToast');
      if (toast) {
        if (toastTimeout) {
          clearTimeout(toastTimeout);
        }
        toast.classList.add('show');
        toast.setAttribute('aria-hidden', 'false');

        // Displays like a Minecraft achievement toast then slides back up
        toastTimeout = setTimeout(() => {
          toast.classList.remove('show');
          toast.setAttribute('aria-hidden', 'true');
          toastTimeout = null;
        }, 4200);
      }
    }

    function handleHeroBannerClick(e) {
      if (achievementTriggered) return;
      if (e && e.button !== 0) return;
      if (hasDragged || suppressClick) return;

      heroClickCount += 1;

      if (heroClickResetTimer) {
        clearTimeout(heroClickResetTimer);
      }

      if (heroClickCount >= 5) {
        heroClickCount = 0;
        showMinecraftAchievement();
      } else {
        // Reset counter if taps pause for 2.5 seconds
        heroClickResetTimer = setTimeout(() => {
          heroClickCount = 0;
          heroClickResetTimer = null;
        }, 2500);
      }
    }

    heroWrapper.addEventListener('click', handleHeroBannerClick);
  }

  // ========================================================
  // 6. Custom Orange Circle Cursor Logic (Body & Modal Top Layer)
  // ========================================================
  const cursor = document.getElementById('customCursor');
  if (cursor && window.matchMedia('(pointer: fine)').matches) {
    let mouseX = -100;
    let mouseY = -100;
    let cursorX = -100;
    let cursorY = -100;
    let isMoving = false;

    function updateCursorPos(e) {
      if (typeof e.clientX !== 'number') return;
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isMoving) {
        cursorX = mouseX;
        cursorY = mouseY;
        isMoving = true;
      }
      cursor.classList.add('visible');
      if (modalCursor) {
        modalCursor.classList.add('visible');
      }
    }

    window.addEventListener('mousemove', updateCursorPos, { passive: true });
    window.addEventListener('pointermove', updateCursorPos, { passive: true });
    if (videoModal) {
      videoModal.addEventListener('mousemove', updateCursorPos, { passive: true });
      videoModal.addEventListener('pointermove', updateCursorPos, { passive: true });
    }

    document.addEventListener('mouseleave', () => {
      cursor.classList.remove('visible');
      if (modalCursor) {
        modalCursor.classList.remove('visible');
      }
    });

    // Dynamic hover scaling effect on clickable & interactive elements
    function checkInteractiveHover(target) {
      if (!target || typeof target.closest !== 'function') return false;
      return !!target.closest(
        'a, button, [role="button"], .media-box, .play-btn, .cinema-close-btn, .scroll-prompt, input, .hero-media-wrapper, video, .cinema-btn, .cinema-timeline-container'
      );
    }

    document.addEventListener('mouseover', (e) => {
      if (!isPointerDown && checkInteractiveHover(e.target)) {
        cursor.classList.add('hovered');
        if (modalCursor) modalCursor.classList.add('hovered');
      }
    }, { passive: true });

    document.addEventListener('mouseout', (e) => {
      if (checkInteractiveHover(e.target)) {
        cursor.classList.remove('hovered');
        if (modalCursor) modalCursor.classList.remove('hovered');
      }
    }, { passive: true });

    let clickTimeout = null;
    let clickStartTime = 0;

    function setClickingState(isClicking) {
      if (isClicking) {
        if (clickTimeout) {
          clearTimeout(clickTimeout);
          clickTimeout = null;
        }
        clickStartTime = performance.now();
        cursor.classList.add('clicking');
        if (modalCursor) {
          modalCursor.classList.add('clicking');
        }
      } else {
        const elapsed = performance.now() - clickStartTime;
        const minDuration = 120; // Ensures quick taps visibly complete circle-to-box transition
        if (elapsed < minDuration) {
          clickTimeout = setTimeout(() => {
            cursor.classList.remove('clicking');
            if (modalCursor) {
              modalCursor.classList.remove('clicking');
            }
            clickTimeout = null;
          }, minDuration - elapsed);
        } else {
          cursor.classList.remove('clicking');
          if (modalCursor) {
            modalCursor.classList.remove('clicking');
          }
        }
      }
    }

    window.addEventListener('pointerdown', (e) => {
      if (e.button === 0) {
        setClickingState(true);
      }
    }, { capture: true });

    window.addEventListener('pointerup', () => {
      setClickingState(false);
    }, { capture: true });

    window.addEventListener('pointercancel', () => {
      setClickingState(false);
    }, { capture: true });

    window.addEventListener('blur', () => {
      setClickingState(false);
    });

    function renderCursor() {
      cursorX += (mouseX - cursorX) * 0.5;
      cursorY += (mouseY - cursorY) * 0.5;
      const transformVal = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
      cursor.style.transform = transformVal;
      if (modalCursor) {
        modalCursor.style.transform = transformVal;
      }
      requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);
  }

  // ========================================================
  // 7. Drag-To-Scroll (Smooth 1:1 Left-Click Mouse Dragging with Natural Inertia)
  // ========================================================

  function startMomentum(initialVelocity) {
    stopMomentum();
    if (Math.abs(initialVelocity) < 0.08) return;

    // initialVelocity is in px/ms; convert to per-frame delta (~16.67ms)
    let currentVelocity = initialVelocity * 16.67;
    const maxVelocity = 65;
    currentVelocity = Math.max(-maxVelocity, Math.min(maxVelocity, currentVelocity));

    let lastFrameTime = performance.now();

    function step(timestamp) {
      if (isPointerDown) {
        return;
      }

      const elapsed = Math.min(timestamp - lastFrameTime, 32);
      lastFrameTime = timestamp;

      // Tight, natural friction decay
      const friction = Math.pow(0.92, elapsed / 16.67);
      currentVelocity *= friction;

      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const currentScroll = window.scrollY || document.documentElement.scrollTop;

      // Hard stop cleanly at boundaries
      if ((currentScroll <= 0.5 && currentVelocity < 0) || (currentScroll >= maxScroll - 1 && currentVelocity > 0)) {
        currentVelocity = 0;
      }

      if (Math.abs(currentVelocity) > 0.3) {
        window.scrollBy(0, currentVelocity);
        momentumRaf = requestAnimationFrame(step);
      } else {
        momentumRaf = null;
      }
    }

    momentumRaf = requestAnimationFrame(step);
  }

  function activateClickSuppression() {
    suppressClick = true;
    if (suppressClickTimer) {
      clearTimeout(suppressClickTimer);
    }
    // Auto-expire after 350ms just in case the browser did not dispatch a click event
    suppressClickTimer = setTimeout(() => {
      suppressClick = false;
      suppressClickTimer = null;
    }, 350);
  }

  // Multiplier so left-click drag feels as swift and responsive as mouse scroll wheel
  const DRAG_SPEED_MULTIPLIER = 2.4;

  function endDrag() {
    if (!isPointerDown) return;
    isPointerDown = false;

    // Safely release pointer capture
    if (activeCaptureTarget && activePointerId !== null) {
      try {
        if (typeof activeCaptureTarget.hasPointerCapture === 'function' &&
          activeCaptureTarget.hasPointerCapture(activePointerId)) {
          activeCaptureTarget.releasePointerCapture(activePointerId);
        }
      } catch (_) { }
      activeCaptureTarget = null;
      activePointerId = null;
    }

    if (cursor) {
      cursor.classList.remove('dragging', 'clicking');
    }
    if (modalCursor) {
      modalCursor.classList.remove('dragging', 'clicking');
    }
    document.body.classList.remove('is-dragging');

    if (hasDragged) {
      activateClickSuppression();

      const now = performance.now();
      let releaseVelocity = 0;
      const recentMoves = moveHistory.filter(m => (now - m.time) <= 60);

      if (recentMoves.length >= 2) {
        const oldest = recentMoves[0];
        const latest = recentMoves[recentMoves.length - 1];
        const dt = latest.time - oldest.time;
        // Only trigger momentum if pointer was actively moving when released (not paused/held still)
        if ((now - latest.time) <= 45 && dt >= 15) {
          const dy = latest.y - oldest.y;
          // Dragging up (dy < 0) scrolls down (positive velocity), scaled to scroll-wheel speed
          releaseVelocity = (-dy / dt) * DRAG_SPEED_MULTIPLIER;
        }
      }

      moveHistory = [];

      if (Math.abs(releaseVelocity) > 0.08) {
        startMomentum(releaseVelocity);
      }
    } else {
      moveHistory = [];
    }

    // Re-arm idle timer if user is still at top of the page
    if (window.scrollY <= 20) {
      scheduleIdleTimer();
    }
  }

  window.addEventListener('pointerdown', (e) => {
    // Only primary left mouse button (or pen). Mobile touch uses native compositor touch scroll.
    if (e.button !== 0 || e.pointerType === 'touch') return;

    // Do not initiate drag-scroll inside video modal dialog or form controls
    if (videoModal && videoModal.open) return;
    if (e.target.closest('#videoModal, input, textarea, select')) return;

    stopMomentum();
    cancelAutoScrollAnimation();

    isPointerDown = true;
    hasDragged = false;
    startX = e.clientX;
    startY = e.clientY;
    lastX = e.clientX;
    lastY = e.clientY;
    const now = performance.now();
    moveHistory = [{ y: e.clientY, time: now }];

    // Request pointer capture so drag is never lost even if mouse leaves window or crosses over cards
    try {
      e.target.setPointerCapture(e.pointerId);
      activeCaptureTarget = e.target;
      activePointerId = e.pointerId;
    } catch (_) { }
  });

  window.addEventListener('pointermove', (e) => {
    if (!isPointerDown) return;

    const totalDeltaX = e.clientX - startX;
    const totalDeltaY = e.clientY - startY;

    if (!hasDragged) {
      // 5px threshold to separate clicks from drag intent
      if (Math.hypot(totalDeltaX, totalDeltaY) >= 5) {
        hasDragged = true;
        // Align last position so the first scroll delta doesn't jump
        lastY = e.clientY;
        lastX = e.clientX;
        const now = performance.now();
        moveHistory = [{ y: e.clientY, time: now }];

        document.body.classList.add('is-dragging');
        if (cursor) {
          cursor.classList.add('dragging');
        }
        if (modalCursor) {
          modalCursor.classList.add('dragging');
        }
        window.getSelection()?.removeAllRanges();
      }
    }

    if (hasDragged) {
      // Prevent browser default actions (native text selection, drag-and-drop initiation, gesture navigation)
      e.preventDefault();

      const deltaY = e.clientY - lastY;
      if (deltaY !== 0) {
        window.scrollBy(0, -deltaY * DRAG_SPEED_MULTIPLIER);
      }

      const now = performance.now();
      moveHistory.push({ y: e.clientY, time: now });
      if (moveHistory.length > 8) {
        moveHistory = moveHistory.filter(m => (now - m.time) <= 70);
      }

      lastY = e.clientY;
      lastX = e.clientX;
    }
  }, { passive: false });

  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  window.addEventListener('lostpointercapture', endDrag);
  window.addEventListener('mouseup', endDrag);
  window.addEventListener('blur', endDrag);

  // If user scrolls via wheel during inertia, cleanly cancel inertia
  window.addEventListener('wheel', () => {
    stopMomentum();
  }, { passive: true });

  // Prevent native text selection while left-click dragging
  document.addEventListener('selectstart', (e) => {
    if (isPointerDown) {
      e.preventDefault();
    }
  });

  // Prevent browser native image/link dragging from cancelling pointer events
  window.addEventListener('dragstart', (e) => {
    if (isPointerDown || hasDragged || e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO' || e.target.closest('img, video, .media-box, .hero-media-wrapper')) {
      e.preventDefault();
      return false;
    }
  });

  // Prevent right-click context menu (Save image as, Save video, Inspect, etc.) on media
  document.addEventListener('contextmenu', (e) => {
    if (
      e.target.tagName === 'IMG' ||
      e.target.tagName === 'VIDEO' ||
      e.target.closest('.media-box, .hero-media-wrapper, .cinema-video-wrapper, .hero-section')
    ) {
      e.preventDefault();
      return false;
    }
  });

  // Prevent Ctrl+S / Cmd+S save page shortcut
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
    }
    stopMomentum();
  });

  // Capture phase click interceptor: suppress click if drag just ended
  window.addEventListener(
    'click',
    (e) => {
      if (suppressClick) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        suppressClick = false;
        if (suppressClickTimer) {
          clearTimeout(suppressClickTimer);
          suppressClickTimer = null;
        }
      }
    },
    true
  );
});

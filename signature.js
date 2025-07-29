function initSignaturePad() {
    const canvas = document.getElementById('signature-pad');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let drawing = false;
    let lastX = 0;
    let lastY = 0;
    function drawLine(x, y) {
        if (!drawing) return;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        [lastX, lastY] = [x, y];
    }
    canvas.addEventListener('mousedown', function (e) {
        drawing = true;
        const rect = canvas.getBoundingClientRect();
        lastX = e.clientX - rect.left;
        lastY = e.clientY - rect.top;
    });
    canvas.addEventListener('mousemove', function (e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        drawLine(x, y);
    });
    canvas.addEventListener('mouseup', function () {
        drawing = false;
    });
    canvas.addEventListener('mouseout', function () {
        drawing = false;
    });
    // Touch support
    canvas.addEventListener('touchstart', function (e) {
        e.preventDefault();
        drawing = true;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        lastX = touch.clientX - rect.left;
        lastY = touch.clientY - rect.top;
    });
    canvas.addEventListener('touchmove', function (e) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        drawLine(x, y);
    });
    canvas.addEventListener('touchend', function () {
        drawing = false;
    });
}

function saveSignature() {
    const canvas = document.getElementById('signature-pad');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const input = document.getElementById('signature-input');
    if (input) {
        input.value = dataUrl;
    }
}

function clearSignature() {
    const canvas = document.getElementById('signature-pad');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const input = document.getElementById('signature-input');
    if (input) {
        input.value = '';
    }
}

// Initialize signature pad on page load
document.addEventListener('DOMContentLoaded', initSignaturePad);
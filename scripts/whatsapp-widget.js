// WhatsApp Widget JavaScript
(function() {
    const whatsappWidget = document.getElementById('whatsappWidget');
    const whatsappBtn = document.getElementById('whatsappBtn');
    const whatsappChatBar = document.getElementById('whatsappChatBar');
    const closeBtn = document.getElementById('closeBtn');

    if (!whatsappBtn || !whatsappChatBar || !closeBtn) {
        return;
    }

    // Toggle chat bar
    whatsappBtn.addEventListener('click', function() {
        whatsappChatBar.classList.add('active');
    });

    // Close chat bar only (not the widget)
    closeBtn.addEventListener('click', function() {
        whatsappChatBar.classList.remove('active');
    });

    // Close chat bar when clicking outside
    document.addEventListener('click', function(e) {
        if (!whatsappChatBar.contains(e.target) && !whatsappBtn.contains(e.target)) {
            whatsappChatBar.classList.remove('active');
        }
    });
})();

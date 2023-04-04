Array.from(document.querySelectorAll('.dropdown')).forEach(dropdown => {
    if(!dropdown.classList.contains('manual-initialization')) {
        initializeDropdown(dropdown);
    }
});

export function initializeDropdown(dropdown) {
    const type = dropdown.dataset.type == undefined ? 1 : dropdown.dataset.type;

    const select = dropdown.querySelector('.select');
    const caret = dropdown.querySelector('.caret');
    const menus = dropdown.querySelectorAll('.menu');
    const options = dropdown.querySelectorAll('.menu li');
    const selected = dropdown.querySelector('.selected');

    select.addEventListener('click', () => {
        select.classList.toggle('clicked');
        if(caret) {
            caret.classList.toggle('clicked');
        }

        for(let menu of menus) menu.classList.toggle('open');
    });

    options.forEach(option => {
        option.addEventListener('click', () => {
            if(option.classList.contains("noclose")) {
                return;
            }
            
            if(type === '1') {
                selected.innerHTML = option.innerHTML;
            }
            
            if(caret) {
                caret.classList.remove('clicked');
            }

            select.classList.remove('clicked');
            for(let menu of menus) menu.classList.remove('open');
            if(type === '1') {
                options.forEach(option => {
                    option.classList.remove('active');
                })
    
                option.classList.add('active');
            }
        });
    });
}

export function addSelectionListener(dropdown, listener) {    
    dropdown.querySelectorAll('.menu li').forEach(option => {
        option.addEventListener('click', () => {
            listener(option);
        });
    });
}
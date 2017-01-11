" ==========================================================
" Dependencies - Libraries/Applications outside of vim
" ==========================================================
" autopep8


" Allow vim options to be embedded in files;
set modeline

" This setting prevents vim from emulating the original vi's
" bugs and limitations.
set nocompatible              " Don't be compatible with vi

let mapleader = ","
let g:mapleader = ","

" set the default encoding
set enc=utf-8

" :terminal settings
let g:terminal_scrollback_buffer_size=100000

" Set the font size
set guifont=Monospace\ 9

" have fifty lines of command-line (etc) history:
set history=10000

if has('mouse')
    " have the mouse enabled all the time
    set mouse=a
    " make a menu popup on right click
    set mousemodel=popup
endif

" The first setting tells vim to use "autoindent" (that is, use the current
" line's indent level to set the indent level of new lines). The second makes
" vim attempt to intelligently guess the indent level of any new line based on
" the previous line.
set autoindent
set smartindent

" Use sane regexes.
nnoremap / /\v
vnoremap / /\v

" Enhanced command menu ctrl + d to expand directories
set wildmenu
" comand <Tab> completion, list matches, then longest common part, then all.
set wildmode=list:longest,full
set wildignore+=*.pyc,*.pyo,CVS,.svn,.git,*.mo,.DS_Store,*.pt.cache,*.Python,*.o,*.lo,*.la,*~,.AppleDouble,*/blobstorage/*,*/Paste*-*.egg/*

" hide matches on <leader>space
nnoremap <leader><space> :nohlsearch<cr>

" Remove trailing whitespace on <leader>S
nnoremap <leader>S :%s/\s\+$//<cr>:let @/=''<CR>

" Select the item in the list with enter
inoremap <expr> <CR> pumvisible() ? "\<C-y>" : "\<C-g>u\<CR>"

" ctrl-jklm  changes to that split
map <c-j> <c-w>j
map <c-k> <c-w>k
map <c-l> <c-w>l
map <c-h> <c-w>h

" NERDTree
let NERDTreeIgnore = ['\.pyc$']
map <leader>n :NERDTreeToggle<CR>

" Gundo
map <leader>g :GundoToggle<CR>

" Paste from clipboard
map <leader>p "+p

" ==========================================================
" Pathogen - Allows us to organize our vim plugins
" ==========================================================
" Load pathogen with docs for all plugins
filetype off
call pathogen#infect()
call pathogen#helptags()

" ==========================================================
" Basic Settings
" ==========================================================
syntax on                     " syntax highlighing
filetype on                   " try to detect filetypes
filetype plugin indent on     " enable loading indent file for filetype
set number                    " Display line numbers
set numberwidth=1             " using only 1 column (and 1 space) while possible
set relativenumber            " relative line numbering
set background=dark           " We are using dark background in vim
set title                     " show title in console title bar

" don't bell or blink
set noerrorbells
" tell the bell to go beep itself
set vb t_vb=

" Ignore these files when completing
set wildignore+=*.o,*.obj,.svn,.git,*.pyc,*.pyo,*.cache
set wildignore+=eggs/**
set wildignore+=*.egg-info/**

" Set working directory
nnoremap <leader>. :lcd %:p:h<CR>


""" Insert completion
" don't select first item, follow typing in autocomplete
"set completeopt=menuone,longest,preview
set pumheight=6             " Keep a small completion window

""" Moving Around/Editing
set cursorline              " have a line indicate the cursor location
set ruler                   " show the cursor position all the time
set nostartofline           " Avoid moving cursor to BOL when jumping around
" Let cursor move past the last character
set virtualedit=onemore
set scrolloff=5             " Keep 5 context lines above and below the cursor

set showmatch               " Briefly jump to a paren once it's balanced
set linebreak               " don't wrap textin the middle of a word
set tabstop=4               " <tab> inserts 4 spaces
set shiftwidth=4            " but an indent level is 2 spaces wide.
set softtabstop=4           " <BS> over an autoindent deletes both spaces.
set expandtab               " Use spaces, not tabs, for autoindent/tab key.
set shiftround              " rounds indent to a multiple of shiftwidth
set matchpairs+=<:>         " show matching <> (html mainly) as well
"set foldmethod=indent       " allow us to fold on indents
"set foldlevel=99            " don't fold by default

" don't outdent hashes
inoremap # #
" close preview window automatically when we move around
autocmd CursorMovedI * if pumvisible() == 0|pclose|endif
autocmd InsertLeave * if pumvisible() == 0|pclose|endif

"""" Messages, Info, Status
set ls=2                    " always show status line
set vb t_vb=                " Disable all bells.  I hate ringing/flashing.
set confirm                 " Y-N-C prompt if closing with unsaved changes.
set showcmd                 " Show incomplete normal mode commands as I type.
set report=0                " : commands always print changed line count.
set shortmess+=a            " Use [+]/[RO]/[w] for modified/readonly/written.
set ruler                   " Show some info, even without statuslines.
set guioptions-=T  "remove toolbar

" displays tabs with :set list & displays when a line runs off-screen
set listchars=tab:>-,eol:$,trail:-,precedes:<,extends:>
set nolist

""" Searching and Patterns
set ignorecase              " Default to using case insensitive searches,
set smartcase               " unless uppercase letters are used in the regex.
set smarttab                " Handle tabs more intelligently
set hlsearch                " Highlight searches by default.
set incsearch               " Incrementally search while typing a /regex

" Color scheme
"colorscheme solarized
colorscheme molokai
" Airline theme
let g:airline_theme='powerlineish'

" ===========================================================
" FileType specific changes
" ============================================================
" HTML types
autocmd BufNewFile,BufRead *.mako,*.mak,*.jinja2,*.handlebars setlocal ft=html
autocmd FileType html,xhtml,xml,css setlocal expandtab shiftwidth=2 tabstop=2 softtabstop=2

" Python
"au BufRead *.py compiler nose
au FileType python set omnifunc=pythoncomplete#Complete
au FileType python setlocal expandtab shiftwidth=4 tabstop=8 softtabstop=4 smartindent cinwords=if,elif,else,for,while,try,except,finally,def,class,with
au BufRead *.py set efm=%C\ %.%#,%A\ \ File\ \"%f\"\\,\ line\ %l%.%#,%Z%[%^\ ]%\\@=%m

" Javascript
autocmd FileType javascript set formatprg=prettier\ --stdin

" Don't let pyflakes use the quickfix window
let g:pyflakes_use_quickfix = 0

" Line length indicators
highlight OverLength ctermbg=red ctermfg=white guibg=#592929
match OverLength /\%79v.\+/
set colorcolumn=79


"braceless python folding

" Make cursor move by visual lines instead of file lines (when wrapping)
" " This makes me feel more at home :)
map <up> gk
map k gk
imap <up> <C-o>gk
map <down> gj
map j gj
imap <down> <C-o>gj
map E ge

"https://github.com/junegunn/fzf
"
"

" Autopep8
let g:autopep8_disable_show_diff=1
let g:autopep8_pep8_passes=2000
let g:autopep8_aggressive=1

" yapf
"noremap <buffer> <F8> :call yapf#YAPF()<cr>
"map <F8> :call yapf#YAPF() | :call Autopep8()<cr>
map <F9> :call yapf#YAPF()<cr>
imap <F9> <c-o>:call yapf#YAPF()<cr>

" python-mode
let g:pymode_breakpoint = 1 " Enable breakpoints
let g:pymode_breakpoint_bind = '<leader>b' " Breakpoint binding
let g:pymode_breakpoint_cmd = 'from ipdb import set_trace; set_trace()'
let g:pymode_folding = 0 " Disable folding
let g:pymode_indent = 1 " Enable pep8 compliant indents
let g:pymode_lint = 1 " Enable linting
let g:pymode_lint_on_write = 1 " Run linters when file is saved
let g:pymode_lint_checkers = ['pyflakes', 'pep8'] " Linters to run
let g:pymode_lint_unmodified = 1 " Lint on save even if unmodified
let g:pymode_lint_on_fly = 1 " Lint on the fly
let g:pymode_lint_signs = 1 " Show lint problems next to line numbers
let g:pymode_lint_cwindow = 0 " Hide lint window
let g:pymode_rope = 0 " Disable rope

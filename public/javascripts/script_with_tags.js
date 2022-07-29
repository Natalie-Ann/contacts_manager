class Controller {
    constructor(model, view) {
        this.model = model;
        this.view = view;

        this.onDataChanged(); //display main page 
        this.model.bindDataChanged(this.onDataChanged.bind(this)); //give model access to the onDataChanged method

        this.view.bindSubmitContact(this.handleSubmitContact); //calls bindSubmitContact with handler
        this.view.bindDeleteContact(this.handleDeleteContact);
        this.view.bindGetSpecificContact(this.handleGetSpecificContact.bind(this));
        this.view.bindEditContact(this.handleEditContact);
    }

    async onDataChanged() {
        let contacts = await this.model.getContacts();
        this.view.displayContacts(contacts);
    }

    handleSubmitContact = (contact) => {
        this.model.addContact(contact);
    }

    handleDeleteContact = (id) => {
        this.model.deleteContact(id);
    }

    async handleGetSpecificContact(id) {
        let contactObject = await this.model.getSpecificContact(id);
        this.view.displayEditContactForm(contactObject);
    }

    handleEditContact = (contact, id) => {
        this.model.editContact(contact, id);
    }

}

class Model {
    constructor() {
        this.contacts;
    }

    async getContacts() {
        await fetch("api/contacts")
        .then(response => response.json())
        .then(data => {
            console.log('fetch GET worked!');
            this.contacts = data;
        });
        console.log(this.contacts);
        return this.contacts;
    }

    async addContact(contact) {
        await fetch("api/contacts", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contact)
        })
        .then(response => response.json())
        .then(() => {
            console.log('fetch POST worked!');

        })
        this.onDataChanged();
    }

    async deleteContact(id) {
        await fetch(`http://localhost:3000/api/contacts/${id}`, {
            method: 'DELETE',
        })
        .then((response) => {
            response.text();
            console.log('fetch delete worked!');
        });
        this.onDataChanged();
    }
    
    async getSpecificContact(id) {
        let contactObject = await fetch(`http://localhost:3000/api/contacts/${id}`)
        .then((response) => response.json());

        return contactObject;  
    }

    async editContact(contact, id) {
        await fetch(`http://localhost:3000/api/contacts/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contact),
        })
        .then((response) => {
            console.log('fetch edit successful!');
        });

        this.onDataChanged();
    }

    bindDataChanged(callback) {
        this.onDataChanged = callback;
    }

}

class View {
    constructor() {
        this.currentContactID;
        this.contacts;
        this.tags;

        this.homePageLink = document.querySelector('#homePageLink');
        this.addAndSearch = document.querySelector('#addAndSearch');
        this.contactsBody = document.querySelector('#contactsBody');
        this.mainContainer = document.querySelector('#mainContainer');

        this.displayContactsTemplate = document.querySelector("#displayContacts"); //select handlebars script from html
        this.displayContactsScript = Handlebars.compile(this.displayContactsTemplate.innerHTML); //c
        this.contactsList = document.querySelector('#contactsList');

        this.addContactContainer = document.querySelector('#addContactContainer');
        this.addContactForm = document.querySelector('#addContactForm');
        this.addContactButtons = document.querySelectorAll("[class='btn btn-lg btn-outline']")

        this.editContactContainer = document.querySelector('#editContactContainer');
        this.editContactScript = document.querySelector('#editContactScript');
        this.displayEditContactScript = Handlebars.compile(this.editContactScript.innerHTML);

        this.emptySearch = document.querySelector('#emptySearch');
        this.noContacts = document.querySelector('#noContacts');

        this.searchBar = document.querySelector('#searchBar');

        this.contactTags = document.querySelector('#contactTags');

        this.displayAddContactForm();
        this._cancelButtons();
        this.displayHome();
        this.searchContacts();
        this.searchTags();
        
    }

    displayHome() {
        this.homePageLink.addEventListener("click", (e) => {
            e.preventDefault();

            this.displayContacts(this.contacts);
          });

        document.querySelector('#displayAllContacts').addEventListener('click', (e) => {
            e.preventDefault();

            this.displayContacts(this.contacts);
        })
    }

    showDefaultView() {
        this.contactsBody.style.display = 'inherit';

        [this.noContacts, this.emptySearch, this.addContactContainer, this.editContactContainer].forEach(part => part.style.display = "none");
    }

    hideDefaultView() {
        this.contactsBody.style.display = 'none';
    }

    displayContacts(contacts) {
        this.contacts = contacts;
        contacts.forEach(contact => {
            if (typeof contact.tags === 'string') {
                contact.tags = contact.tags.split(',');
            }
            
        })
        this.showDefaultView();

        this.contactsList.innerHTML = this.displayContactsScript({contact: contacts});
        this.getTagsAndClean();

        if (contacts.length === 0) {
            this.noContacts.style.display = "inherit";
        }

    }

    displayFilteredContacts(filteredContacts) {
        this.showDefaultView();

        this.contactsList.innerHTML = this.displayContactsScript({contact: filteredContacts});

        if (filteredContacts.length === 0) {
            this.emptySearch.style.display = 'inherit';
        }

    }

    displayAddContactForm() {
        [...this.addContactButtons].forEach(button => {
            button.addEventListener('click', (e) => {
                // this.addContactForm.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.removeAttribute('checked'));
                this.addContactContainer.style.display = 'inherit';
                this.addContactForm.reset();
                this.fillInTagOptions();
                this.hideDefaultView();
            })
        });
    }

    displayEditContactForm(contactObject) {
        console.log(contactObject);
        this.hideDefaultView();
        this.editContactContainer.innerHTML = this.displayEditContactScript(contactObject);
        this.fillInTagEditOptions(contactObject);
        this.editContactContainer.style.display = 'inherit';
        this.currentContactID = contactObject.id;
    }

    _cancelButtons() {
        this.mainContainer.addEventListener('click', (e) => {

            if (e.target.id.startsWith('cancel')) {
                this.showDefaultView();
                this.displayContacts(this.contacts);
            }
        })
    }

    bindSubmitContact(handler) {
        this.addContactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            let textTag = document.querySelector('#textTag');
            textTag.value = textTag.value.split(' ').join(',');
            console.log(textTag);

            let contactData = Object.fromEntries(new FormData(addContactForm));
            let contactObject = new FormData(addContactForm);
            contactData.tags = String([...new Set(contactObject.getAll('tags').filter(tag => tag))]);
            if (contactData.tags === '') {
                contactData.tags = null;
            }

            console.log(contactData);

            handler(contactData);
        })
    }

    fillInTagOptions() {
        let tagOptions = document.querySelector('#tagOptions');
        tagOptions.replaceChildren();
        this.tags.forEach(tag => {
            let tagOption = new Option(tag); 
            tagOptions.append(tagOption);
        });

    }

    fillInTagEditOptions(contactObject) {
        let tagOptions = document.querySelector('#tagEditOptions');
        tagOptions.replaceChildren();
        this.tags.forEach(tag => {
            let tagOption = new Option(tag);
            if ((contactObject.tags) && contactObject.tags.includes(tag)) {
                tagOption.setAttribute('selected', true);
            } 
            tagOptions.append(tagOption);
        });

    }

    bindDeleteContact(handler) {
        this.contactsList.addEventListener('click', (e) => {
            e.preventDefault();
            
            console.log('delete event');

            if (e.target.id.startsWith('Delete') && confirm('Are you sure you want to delete this contact?')) {
                let id = e.target.id.match(/[0-9]/gi).join('');
                handler(id); //call on handler in controller
            } 
        })

    }

    bindGetSpecificContact(handler) {
        this.contactsList.addEventListener('click', (e) => {
            e.preventDefault();
            
            console.log('edit event');

            if (e.target.id.startsWith('Edit')) {
                let id = e.target.id.match(/[0-9]/gi).join('');
                handler(id);
            } 
        })
    }

    bindEditContact(handler) {
        this.editContactContainer.addEventListener('submit', (e) => {
            e.preventDefault();

            let editContactForm = document.querySelector('#editContactForm');
            
            console.log('trying to edit');
    
            let contactData = new FormData(editContactForm);
            let contactObject = Object.fromEntries(new FormData(editContactForm));
            contactObject.tags = String([...new Set(contactData.getAll('tags').filter(tag => tag))]);
            if (contactObject.tags === '') {
                contactObject.tags = null;
            }
                
            console.log(contactObject);
            
            handler(contactObject, this.currentContactID);

        });     
    }
    
    searchContacts() {
        this.searchBar.addEventListener("input", (e) => {
            let currentWord = this.searchBar.value;
            document.querySelector('#searchValue').textContent = currentWord;
          
            let filteredContacts = this.contacts.filter((contactCard) =>
              contactCard.full_name.toLowerCase().includes(currentWord.toLowerCase())
            );

            this.displayFilteredContacts(filteredContacts);

          });
    }

    getTagsAndClean() {
        this.tags = [...new Set(this.contacts.map(contact => {
            if (contact.tags) {
                return String(contact.tags).trim().toLowerCase()
            }
            }))].filter(tag => tag);
        
        this.tags = [...new Set(this.tags.reduce((accum, current) => {
            if (current.includes(',')) {
                let split = current.split(',');
                return accum.concat(split);
            }
            return accum.concat(current);
        }, []))];

        
        console.log(this.tags);
        return this.tags;
    }

    searchTags() {
        this.contactsList.addEventListener('click', (e) => {
            e.preventDefault();

            console.log('search tags click');
            console.log(e.target.textContent);

            if (e.target.nodeName === 'A' && e.target.textContent.startsWith('#')) {
                let filteredNames = this.contacts.filter((contactCard) => {
                    if (contactCard.tags) {
                        return contactCard.tags.some(tag => tag.toLowerCase() === e.target.textContent.slice(1).toLowerCase())
                    }
                });
                this.displayFilteredContacts(filteredNames);
            }
            
            
        });
    }
}

const app = new Controller(new Model(), new View())
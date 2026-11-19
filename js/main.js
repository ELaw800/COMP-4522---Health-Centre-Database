document.addEventListener("DOMContentLoaded", () => {

    const pageTitle = document.getElementById("page-title");
    const pageContent = document.getElementById("page-content");

    const buttons =
        document.querySelectorAll(".nav-btn");

    buttons.forEach((button) => {

        button.addEventListener("click", () => {

            const page =
                button.dataset.page;

            loadPage(page);

        });

    });

    function loadPage(page) {

        pageContent.replaceChildren();

        if (page === "dashboard") {

            pageTitle.textContent =
                "Dashboard";

            createCard(
                "Total Records",
                "Coming Soon"
            );

            createCard(
                "Recent Activity",
                "Coming Soon"
            );
        }

        else if (page === "browse") {

            pageTitle.textContent =
                "Browse Data";

            const paragraph =
                document.createElement("p");

            paragraph.textContent =
                "Database records will appear here.";

            pageContent.appendChild(paragraph);
        }

        else if (page === "add") {

            pageTitle.textContent =
                "Add Record";

            const paragraph =
                document.createElement("p");

            paragraph.textContent =
                "Record form will appear here.";

            pageContent.appendChild(paragraph);
        }

        else if (page === "search") {

            pageTitle.textContent =
                "Search";

            const input =
                document.createElement("input");

            input.type = "text";

            input.placeholder =
                "Search records...";

            pageContent.appendChild(input);
        }

        else if (page === "reports") {

            pageTitle.textContent =
                "Reports";

            const paragraph =
                document.createElement("p");

            paragraph.textContent =
                "Reports will appear here.";

            pageContent.appendChild(paragraph);
        }
    }

    function createCard(title, text) {

        const card =
            document.createElement("div");

        card.classList.add("card");

        const heading =
            document.createElement("h2");

        heading.textContent = title;

        const paragraph =
            document.createElement("p");

        paragraph.textContent = text;

        card.appendChild(heading);
        card.appendChild(paragraph);

        pageContent.appendChild(card);
    }

});
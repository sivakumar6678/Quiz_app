let quizQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let timeLeft = 10;
let timer;
let hintsUsed = 0;
let userAnswers = [];
let categoryScore = {};
let soundEnabled = true; // Sound toggle feature
let maxHints = 3; // Set the maximum number of hints allowed

const homePage = document.getElementById("home-page");
const quizPage = document.getElementById("quiz-page");
const resultPage = document.getElementById("result-page");
const leaderboardPage = document.getElementById("leaderboard-page");
const questionElement = document.getElementById("question");
const optionsElement = document.getElementById("options");
const nextButton = document.getElementById("next-btn");
const progressElement = document.getElementById("progress");
const timerElement = document.getElementById("timer");
const scoreElement = document.getElementById("score");
const leaderboardElement = document.getElementById("leaderboard");
const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");
const badgesElement = document.getElementById("badges");
const reviewElement = document.getElementById("review");
const hintButton = document.getElementById("hint-btn");
const soundToggle = document.getElementById("sound-toggle");

async function startQuiz() {
  const category = document.getElementById("category").value;
  const difficulty = document.getElementById("difficulty").value;
  const quizLength = parseInt(document.getElementById("quiz-length").value);

  // Display selected options as buttons
  document.getElementById("selected-category").textContent = `Category: ${document.getElementById("category").options[document.getElementById("category").selectedIndex].text}`;
  document.getElementById("selected-difficulty").textContent = `Difficulty: ${document.getElementById("difficulty").options[document.getElementById("difficulty").selectedIndex].text}`;
  document.getElementById("selected-quiz-length").textContent = `Number of Questions: ${quizLength}`;

  const apiUrl = `https://opentdb.com/api.php?amount=${quizLength}&category=${category}&difficulty=${difficulty}&type=multiple`;
  const response = await fetch(apiUrl);
  const data = await response.json();
  
  quizQuestions = data.results.map(q => ({
    question: q.question,
    options: [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5),
    answer: q.correct_answer,
    difficulty: q.difficulty // Store difficulty for better hints
  }));

  homePage.classList.add("d-none");
  quizPage.classList.remove("d-none");
  userAnswers = [];
  hintsUsed = 0;
  currentQuestionIndex = 0;
  score = 0;
  
  if (!categoryScore[category]) categoryScore[category] = 0;
  
  loadQuestion();
  startTimer();
}

function loadQuestion() {
  const currentQuestion = quizQuestions[currentQuestionIndex];
  questionElement.innerHTML = currentQuestion.question;
  optionsElement.innerHTML = "";
  
  currentQuestion.options.forEach(option => {
    const button = document.createElement("button");
    button.textContent = option;
    button.classList.add("btn", "btn-outline-primary");
    button.onclick = () => checkAnswer(option);
    optionsElement.appendChild(button);
  });

  progressElement.textContent = `Question ${currentQuestionIndex + 1} of ${quizQuestions.length}`;
  hintButton.disabled = hintsUsed >= maxHints;
}

function checkAnswer(selectedOption) {
  const currentQuestion = quizQuestions[currentQuestionIndex];
  userAnswers[currentQuestionIndex] = selectedOption;

  // Get all option buttons
  const buttons = optionsElement.querySelectorAll("button");
  
  // First, disable all buttons
  buttons.forEach(button => {
    button.disabled = true;
  });

  // Then handle the answer checking
  buttons.forEach(button => {
    const buttonText = button.textContent;
    
    // If this is the correct answer
    if (buttonText === currentQuestion.answer) {
      button.classList.remove("btn-outline-primary");
      button.classList.add("btn-success");
    }
    // If this is the wrong selected answer
    else if (buttonText === selectedOption) {
      button.classList.remove("btn-outline-primary");
      button.classList.add("btn-danger");
    }
  });

  // Handle scoring and feedback
  if (selectedOption === currentQuestion.answer) {
    score++;
    categoryScore[document.getElementById("category").value]++;

    if (soundEnabled) correctSound.play();
    
    // Trigger confetti for correct answer
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  } else {
    if (soundEnabled) wrongSound.play();
    timeLeft -= 3; // Timer penalty for wrong answer
    if (timeLeft < 1) timeLeft = 1;
  }

  nextButton.classList.remove("d-none");
  clearInterval(timer);
}

function nextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex < quizQuestions.length) {
    loadQuestion();
    startTimer();
    nextButton.classList.add("d-none");
  } else {
    showResult();
  }
}

function startTimer() {
  timeLeft = 10;
  timerElement.textContent = `Time Left: ${timeLeft}s`;
  
  timer = setInterval(() => {
    timeLeft--;
    timerElement.textContent = `Time Left: ${timeLeft}s`;
    
    if (timeLeft <= 0) {
      clearInterval(timer);
      checkAnswer(null);
      setTimeout(() => nextQuestion(), 2000);
    }
  }, 1000);
}

function showResult() {
  quizPage.classList.add("d-none");
  resultPage.classList.remove("d-none");

  scoreElement.textContent = `Your Score: ${score} out of ${quizQuestions.length}`;
  saveHighScore();
  awardBadges();
  showReview();
}

function saveHighScore() {
  let highScores = JSON.parse(localStorage.getItem("highScores")) || [];
  
  const category = document.getElementById("category").value;
  highScores.push({ category, score, date: new Date().toLocaleString() });

  highScores = highScores.sort((a, b) => b.score - a.score).slice(0, 5); // Keep top 5 scores

  localStorage.setItem("highScores", JSON.stringify(highScores));
  displayLeaderboard();
}

function displayLeaderboard() {
  let highScores = JSON.parse(localStorage.getItem("highScores")) || [];
  leaderboardElement.innerHTML = highScores.map(score => `
    <li>${score.category}: ${score.score} points on ${score.date}</li>
  `).join("");
}

function awardBadges() {
  badgesElement.innerHTML = score === quizQuestions.length
    ? `<span class="badge bg-success">Perfect Score!</span>`
    : score >= quizQuestions.length * 0.8
    ? `<span class="badge bg-warning">Great Job!</span>`
    : "";
}

function showReview() {
  reviewElement.innerHTML = quizQuestions.map((q, index) => `
    <div>
      <strong>Q${index + 1}:</strong> ${q.question} <br> 
      <span class="${userAnswers[index] === q.answer ? "text-success" : "text-danger"}">
        Your Answer: ${userAnswers[index] || "No answer"}
      </span><br>
      <span class="text-success">Correct Answer: ${q.answer}</span>
    </div>
  `).join("");
}

function useHint() {
  if (hintsUsed < maxHints) {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    let hintMessage = "Think carefully!";

    if (currentQuestion.difficulty === "easy") {
      hintMessage = "Remember the basics!";
    } else if (currentQuestion.difficulty === "medium") {
      hintMessage = "Try eliminating wrong answers.";
    } else if (currentQuestion.difficulty === "hard") {
      hintMessage = "It's tricky! Focus on keywords.";
    }

    alert(hintMessage);
    hintsUsed++;
    hintButton.disabled = hintsUsed >= maxHints; // Disable hint button if max hints are used

    // Change hint button color and text to indicate hint has been used
    hintButton.classList.add("btn-warning");
    hintButton.classList.remove("btn-outline-warning");
    hintButton.innerHTML = `<i class="fas fa-lightbulb"></i> ${maxHints - hintsUsed} Hints Left`; // Update text to show remaining hints

    // Get incorrect options
    const incorrectOptions = currentQuestion.options.filter(option => option !== currentQuestion.answer);
    
    // Randomly select two incorrect options
    const hintOptions = [];
    while (hintOptions.length < 2 && incorrectOptions.length > 0) {
      const randomIndex = Math.floor(Math.random() * incorrectOptions.length);
      hintOptions.push(incorrectOptions[randomIndex]);
      incorrectOptions.splice(randomIndex, 1); // Remove selected option to avoid duplicates
    }

    // Change the color of the hint options
    const buttons = optionsElement.querySelectorAll("button");
    buttons.forEach(button => {
      if (hintOptions.includes(button.textContent)) {
        button.style.backgroundColor = "red"; // Change to yellow for hint options
      }
    });
  } else {
    alert("You have used all your hints!");
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  soundToggle.textContent = soundEnabled ? "Sound: ON" : "Sound: OFF";
}

function restartQuiz() {
  resultPage.classList.add("d-none");
  homePage.classList.remove("d-none");
  badgesElement.innerHTML = "";
  reviewElement.innerHTML = "";
}

function toggleDarkMode() {
  const body = document.body;
  body.classList.toggle("dark-mode");
}

function updateQuizLengthValue() {
  const quizLength = document.getElementById("quiz-length").value;
  document.getElementById("quiz-length-value").textContent = `${quizLength} questions`;
}

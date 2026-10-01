var courses = [];

var form       = document.getElementById('course-form');
var gpaDisplay = document.getElementById('calculated-gpa');
var tableBody  = document.getElementById('courseTableBody');
var emptyRow   = document.getElementById('emptyRow');
var ringFill   = document.getElementById('ringFill');

// ── Grade letter helper ──
function gradeLetter(val) {
  const map = { '4.00':'A+','3.75':'A','3.50':'A-','3.25':'B+','3.00':'B',
                '2.75':'B-','2.50':'C+','2.25':'C','2.00':'D','0.00':'F' };
  return map[parseFloat(val).toFixed(2)] || val;
}

// ── Grade badge class ──
function gradeClass(letter) {
  if (letter.startsWith('A')) return 'grade-a';
  if (letter.startsWith('B')) return 'grade-b';
  if (letter.startsWith('C')) return 'grade-c';
  if (letter === 'D')         return 'grade-d';
  return 'grade-f';
}

// ── Academic standing ──
function standing(gpa) {
  if (gpa >= 3.75) return 'A+';
  if (gpa >= 3.50) return 'A';
  if (gpa >= 3.25) return 'B+';
  if (gpa >= 3.00) return 'B';
  if (gpa >= 2.50) return 'C';
  if (gpa >= 2.00) return 'D';
  return 'F';
}

// ── Ring color by GPA ──
function ringColor(gpa) {
  if (gpa >= 3.5) return '#22c55e';
  if (gpa >= 3.0) return '#3b82f6';
  if (gpa >= 2.5) return '#f59e0b';
  if (gpa >= 2.0) return '#f97316';
  return '#ef4444';
}

// ── Render table ──
function showCourses() {
  // remove all rows except empty-row
  Array.from(tableBody.querySelectorAll('tr:not(#emptyRow)')).forEach(r => r.remove());

  if (courses.length === 0) {
    emptyRow.style.display = '';
    return;
  }
  emptyRow.style.display = 'none';

  courses.forEach(function(c, i) {
    var letter = gradeLetter(c.grade);
    var points = (c.credits * c.grade).toFixed(2);
    var row = document.createElement('tr');
    row.innerHTML =
      '<td>' + (i + 1) + '</td>' +
      '<td><strong>' + c.code + '</strong></td>' +
      '<td>' + c.credits + '</td>' +
      '<td><span class="grade-badge ' + gradeClass(letter) + '">' + letter + '</span></td>' +
      '<td>' + points + '</td>' +
      '<td><button class="delete-btn" onclick="removeCourse(' + i + ')"><i class="fas fa-trash"></i> Remove</button></td>';
    tableBody.appendChild(row);
  });
}

// ── Calculate & update UI ──
function calculateGPA() {
  var totalPoints  = 0;
  var totalCredits = 0;

  courses.forEach(function(c) {
    totalPoints  += c.credits * c.grade;
    totalCredits += c.credits;
  });

  var gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
  var gpaStr = gpa.toFixed(2);

  // GPA number
  gpaDisplay.textContent = gpaStr;

  // Ring animation (circumference = 2π×50 ≈ 314)
  var circumference = 314;
  var offset = circumference - (gpa / 4) * circumference;
  ringFill.style.strokeDashoffset = offset;
  ringFill.style.stroke = ringColor(gpa);

  // Stats
  document.getElementById('stat-courses').textContent = courses.length;
  document.getElementById('stat-credits').textContent = totalCredits;
  document.getElementById('stat-grade').textContent   = totalCredits > 0 ? standing(gpa) : '—';
}

// ── Add course ──
form.addEventListener('submit', function(e) {
  e.preventDefault();

  var code    = document.getElementById('course-code').value.trim();
  var credits = parseFloat(document.getElementById('course-credits').value);
  var grade   = parseFloat(document.getElementById('course-grade').value);

  if (!code || isNaN(credits) || isNaN(grade)) {
    alert('Please fill in all fields.');
    return;
  }
  if (credits <= 0 || credits > 6) {
    alert('Credits must be between 1 and 6.');
    return;
  }

  courses.push({ code: code, credits: credits, grade: grade });
  showCourses();
  calculateGPA();

  document.getElementById('course-code').value   = '';
  document.getElementById('course-credits').value = '';
  document.getElementById('course-grade').value   = '';
  document.getElementById('course-code').focus();
});

// ── Remove course ──
function removeCourse(index) {
  courses.splice(index, 1);
  showCourses();
  calculateGPA();
}

import UIKit
import WebKit
import Network
import UserNotifications

class ViewController: UIViewController, WKNavigationDelegate, WKScriptMessageHandler, UNUserNotificationCenterDelegate {
    
    var webView: WKWebView!
    var refreshControl: UIRefreshControl!
    let pathMonitor = NWPathMonitor()
    var isOnline = true
    
    override func viewDidLoad() {
        super.viewDidLoad()
        UNUserNotificationCenter.current().delegate = self
        setupWebView()
        setupRefreshControl()
        setupNetworkMonitor()
        requestNotificationPermission()
    }
    
    private func setupWebView() {
        let config = WKWebViewConfiguration()
        let contentController = WKUserContentController()
        contentController.add(self, name: "iOSBridge")
        config.userContentController = contentController
        
        webView = WKWebView(frame: self.view.bounds, configuration: config)
        webView.navigationDelegate = self
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        
        // Custom User Agent to identify iOS App version
        webView.customUserAgent = (webView.value(forKey: "userAgent") as? String ?? "") + " GRAPWatchiOS/2.0"
        
        self.view.addSubview(webView)
    }
    
    private func setupRefreshControl() {
        refreshControl = UIRefreshControl()
        refreshControl.tintColor = UIColor(red: 255/255, green: 107/255, blue: 53/255, alpha: 1.0) // #ff6b35
        refreshControl.addTarget(self, action: #selector(refreshData), for: .valueChanged)
        webView.scrollView.refreshControl = refreshControl
    }
    
    @objc private func refreshData() {
        if isOnline {
            webView.evaluateJavaScript("refreshData();") { [weak self] _, _ in
                self?.refreshControl.endRefreshing()
            }
        } else {
            refreshControl.endRefreshing()
            showToast(message: "No internet connection")
        }
    }
    
    private func setupNetworkMonitor() {
        pathMonitor.pathUpdateHandler = { [weak self] path in
            let online = path.status == .satisfied
            if self?.isOnline != online {
                self?.isOnline = online
                DispatchQueue.main.async {
                    self?.loadApp()
                }
            }
        }
        let queue = DispatchQueue(label: "NetworkMonitor")
        pathMonitor.start(queue: queue)
        loadApp()
    }
    
    private func loadApp() {
        if isOnline {
            if let url = URL(string: "https://grap-watch.vercel.app/") {
                webView.load(URLRequest(url: url))
            }
        } else {
            if let offlineURL = Bundle.main.url(forResource: "offline", withExtension: "html") {
                webView.loadFileURL(offlineURL, allowingReadAccessTo: offlineURL.deletingLastPathComponent())
            }
        }
    }
    
    private func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
            if granted {
                print("Notification permission granted")
            }
        }
    }
    
    // MARK: - WKNavigationDelegate
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        refreshControl.endRefreshing()
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        refreshControl.endRefreshing()
        if !isOnline {
            loadApp()
        }
    }
    
    // MARK: - WKScriptMessageHandler
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "iOSBridge",
              let body = message.body as? [String: Any],
              let action = body["action"] as? String else { return }
        
        switch action {
        case "showNotification":
            if let title = body["title"] as? String, let text = body["body"] as? String {
                triggerLocalNotification(title: title, body: text)
            }
        case "requestNotificationPermission":
            requestNotificationPermission()
        case "updateWidget":
            if let aqi = body["aqi"] as? Int,
               let stageName = body["stageName"] as? String,
               let stageColor = body["stageColor"] as? String {
                // Save to shared AppGroup defaults to update WidgetKit widget
                if let defaults = UserDefaults(suiteName: "group.com.grapwatch") {
                    defaults.set(aqi, forKey: "aqi")
                    defaults.set(stageName, forKey: "stageName")
                    defaults.set(stageColor, forKey: "stageColor")
                    defaults.set(Date(), forKey: "lastUpdated")
                }
            }
        default:
            break
        }
    }
    
    private func triggerLocalNotification(title: String, body: String) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 0.1, repeats: false)
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)
        
        UNUserNotificationCenter.current().add(request)
        print("Triggered iOS local notification: \(title) - \(body)")
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        if #available(iOS 14.0, *) {
            completionHandler([.banner, .list, .sound])
        } else {
            completionHandler([.alert, .sound])
        }
    }
    
    private func showToast(message: String) {
        let toast = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        self.present(toast, animated: true)
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            toast.dismiss(animated: true)
        }
    }
}
